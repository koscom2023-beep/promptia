-- ============================================
-- 투표 제한 및 연속 출석(Streak) 시스템
-- 프롬프티아 로드맵 3장
-- ============================================
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- STEP 1: 투표 테이블 수정 (IP/Device 기반 중복 방지)
-- ============================================

-- 기존 votes 테이블 수정 (컬럼 추가)
ALTER TABLE public.votes
ADD COLUMN IF NOT EXISTS voter_ip INET,
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS voted_at DATE DEFAULT CURRENT_DATE;

-- 기존 데이터 마이그레이션 (ip_address → voter_ip)
UPDATE public.votes 
SET voter_ip = ip_address::inet 
WHERE voter_ip IS NULL AND ip_address IS NOT NULL;

-- 동일인이 같은 작품에 하루 1회만 투표하도록 유니크 제약 조건
-- (novel_id + voter_ip + voted_at) 또는 (novel_id + device_id + voted_at) 조합
DROP INDEX IF EXISTS idx_votes_daily_ip_unique;
DROP INDEX IF EXISTS idx_votes_daily_device_unique;

CREATE UNIQUE INDEX idx_votes_daily_ip_unique 
ON public.votes(novel_id, voter_ip, voted_at) 
WHERE voter_ip IS NOT NULL;

CREATE UNIQUE INDEX idx_votes_daily_device_unique 
ON public.votes(novel_id, device_id, voted_at) 
WHERE device_id IS NOT NULL;

-- 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_votes_voter_ip ON public.votes(voter_ip);
CREATE INDEX IF NOT EXISTS idx_votes_device_id ON public.votes(device_id);
CREATE INDEX IF NOT EXISTS idx_votes_voted_at ON public.votes(voted_at);

-- ============================================
-- STEP 2: 출석 체크 테이블 생성
-- ============================================

DROP TABLE IF EXISTS public.attendance CASCADE;

CREATE TABLE public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET, -- 비로그인 사용자용
  device_id TEXT, -- 디바이스 식별
  attendance_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- 동일 사용자가 하루 1회만 출석 체크되도록 제약
  CONSTRAINT attendance_daily_unique UNIQUE (user_id, attendance_date)
);

-- 비로그인 사용자를 위한 유니크 제약 (IP 또는 Device ID 기반)
CREATE UNIQUE INDEX idx_attendance_ip_date 
ON public.attendance(ip_address, attendance_date) 
WHERE user_id IS NULL AND ip_address IS NOT NULL;

CREATE UNIQUE INDEX idx_attendance_device_date 
ON public.attendance(device_id, attendance_date) 
WHERE user_id IS NULL AND device_id IS NOT NULL;

-- 성능 최적화 인덱스
CREATE INDEX idx_attendance_user_date ON public.attendance(user_id, attendance_date DESC);
CREATE INDEX idx_attendance_date ON public.attendance(attendance_date DESC);

-- ============================================
-- STEP 3: 배지(Badge) 테이블 생성
-- ============================================

DROP TABLE IF EXISTS public.user_badges CASCADE;

CREATE TABLE public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET, -- 비로그인 사용자용
  device_id TEXT,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'faithful_reader_7',   -- 7일 연속 출석
    'faithful_reader_30',  -- 30일 연속 출석
    'top_voter',           -- 투표왕
    'early_adopter'        -- 얼리어답터
  )),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  -- 동일 배지 중복 수여 방지
  CONSTRAINT user_badges_unique UNIQUE (user_id, badge_type)
);

-- 비로그인 사용자용 유니크 제약
CREATE UNIQUE INDEX idx_user_badges_ip_type 
ON public.user_badges(ip_address, badge_type) 
WHERE user_id IS NULL AND ip_address IS NOT NULL;

CREATE UNIQUE INDEX idx_user_badges_device_type 
ON public.user_badges(device_id, badge_type) 
WHERE user_id IS NULL AND device_id IS NOT NULL;

-- ============================================
-- STEP 4: 연속 출석일 계산 함수 (Gaps and Islands 알고리즘)
-- ============================================

CREATE OR REPLACE FUNCTION calculate_attendance_streak(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_date_record RECORD;
  v_expected_date DATE;
  v_found_gap BOOLEAN := FALSE;
BEGIN
  -- 가장 최근 출석일부터 역순으로 조회
  FOR v_date_record IN (
    SELECT attendance_date
    FROM public.attendance
    WHERE 
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_user_id IS NULL AND p_ip_address IS NOT NULL AND ip_address = p_ip_address)
      OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND device_id = p_device_id)
    ORDER BY attendance_date DESC
  ) LOOP
    
    -- 첫 번째 레코드
    IF v_current_streak = 0 THEN
      -- 오늘 또는 어제 출석했는지 확인
      IF v_date_record.attendance_date >= CURRENT_DATE - INTERVAL '1 day' THEN
        v_current_streak := 1;
        v_expected_date := v_date_record.attendance_date - INTERVAL '1 day';
      ELSE
        -- 이틀 이상 공백이 있으면 연속 출석 끊김
        EXIT;
      END IF;
    ELSE
      -- 예상 날짜와 일치하는지 확인 (Gaps and Islands)
      IF v_date_record.attendance_date = v_expected_date THEN
        v_current_streak := v_current_streak + 1;
        v_expected_date := v_expected_date - INTERVAL '1 day';
      ELSE
        -- 공백(Gap) 발견 시 종료
        v_found_gap := TRUE;
        EXIT;
      END IF;
    END IF;
  END LOOP;

  RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: 출석 체크 처리 함수 (RPC용)
-- ============================================

CREATE OR REPLACE FUNCTION handle_attendance_streak(
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_streak INTEGER;
  v_new_badge_earned BOOLEAN := FALSE;
  v_result JSON;
BEGIN
  -- 오늘 출석 체크 (중복 방지는 UNIQUE 제약조건이 처리)
  INSERT INTO public.attendance (user_id, ip_address, device_id, attendance_date)
  VALUES (
    p_user_id, 
    p_ip_address::inet, 
    p_device_id, 
    CURRENT_DATE
  )
  ON CONFLICT ON CONSTRAINT attendance_daily_unique DO NOTHING
  ON CONFLICT (ip_address, attendance_date) WHERE user_id IS NULL AND ip_address IS NOT NULL DO NOTHING
  ON CONFLICT (device_id, attendance_date) WHERE user_id IS NULL AND device_id IS NOT NULL DO NOTHING;

  -- 연속 출석일 계산
  v_streak := calculate_attendance_streak(p_user_id, p_ip_address::inet, p_device_id);

  -- 7일 연속 출석 시 배지 수여
  IF v_streak >= 7 THEN
    INSERT INTO public.user_badges (user_id, ip_address, device_id, badge_type)
    VALUES (p_user_id, p_ip_address::inet, p_device_id, 'faithful_reader_7')
    ON CONFLICT ON CONSTRAINT user_badges_unique DO NOTHING
    ON CONFLICT (ip_address, badge_type) WHERE user_id IS NULL AND ip_address IS NOT NULL DO NOTHING
    ON CONFLICT (device_id, badge_type) WHERE user_id IS NULL AND device_id IS NOT NULL DO NOTHING;
    
    -- 새로 수여되었는지 확인 (GET_DIAGNOSTICS는 INSERT 영향 행 수 확인)
    GET DIAGNOSTICS v_new_badge_earned = ROW_COUNT;
  END IF;

  -- 30일 연속 출석 시 배지 수여
  IF v_streak >= 30 THEN
    INSERT INTO public.user_badges (user_id, ip_address, device_id, badge_type)
    VALUES (p_user_id, p_ip_address::inet, p_device_id, 'faithful_reader_30')
    ON CONFLICT ON CONSTRAINT user_badges_unique DO NOTHING
    ON CONFLICT (ip_address, badge_type) WHERE user_id IS NULL AND ip_address IS NOT NULL DO NOTHING
    ON CONFLICT (device_id, badge_type) WHERE user_id IS NULL AND device_id IS NOT NULL DO NOTHING;
  END IF;

  -- 결과 반환
  v_result := json_build_object(
    'streak', v_streak,
    'newBadgeEarned', v_new_badge_earned,
    'attendanceDate', CURRENT_DATE,
    'totalDays', (SELECT COUNT(*) FROM public.attendance 
                  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
                     OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address::inet)
                     OR (p_device_id IS NOT NULL AND device_id = p_device_id))
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: 배지 자동 수여 트리거 (선택사항)
-- ============================================

-- 출석 체크 시 자동으로 연속 출석 확인 및 배지 수여
CREATE OR REPLACE FUNCTION auto_award_attendance_badges()
RETURNS TRIGGER AS $$
DECLARE
  v_streak INTEGER;
BEGIN
  -- 연속 출석일 계산
  v_streak := calculate_attendance_streak(NEW.user_id, NEW.ip_address, NEW.device_id);

  -- 7일 연속 출석 배지
  IF v_streak >= 7 THEN
    INSERT INTO public.user_badges (user_id, ip_address, device_id, badge_type)
    VALUES (NEW.user_id, NEW.ip_address, NEW.device_id, 'faithful_reader_7')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 30일 연속 출석 배지
  IF v_streak >= 30 THEN
    INSERT INTO public.user_badges (user_id, ip_address, device_id, badge_type)
    VALUES (NEW.user_id, NEW.ip_address, NEW.device_id, 'faithful_reader_30')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_award_badges ON public.attendance;
CREATE TRIGGER trigger_auto_award_badges
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_attendance_badges();

-- ============================================
-- STEP 7: RLS (Row Level Security) 정책
-- ============================================

-- attendance 테이블 RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "출석 기록 조회 가능" 
ON public.attendance FOR SELECT 
USING (true);

CREATE POLICY "출석 체크 가능" 
ON public.attendance FOR INSERT 
WITH CHECK (true);

-- user_badges 테이블 RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "배지 조회 가능" 
ON public.user_badges FOR SELECT 
USING (true);

-- ============================================
-- STEP 8: 편의 함수 - 사용자별 배지 목록 조회
-- ============================================

CREATE OR REPLACE FUNCTION get_user_badges(
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  badge_type TEXT,
  earned_at TIMESTAMPTZ,
  badge_name TEXT,
  badge_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.badge_type,
    b.earned_at,
    CASE b.badge_type
      WHEN 'faithful_reader_7' THEN '성실한 독자'
      WHEN 'faithful_reader_30' THEN '완벽한 독자'
      WHEN 'top_voter' THEN '투표왕'
      WHEN 'early_adopter' THEN '얼리어답터'
      ELSE b.badge_type
    END AS badge_name,
    CASE b.badge_type
      WHEN 'faithful_reader_7' THEN '7일 연속 출석 달성'
      WHEN 'faithful_reader_30' THEN '30일 연속 출석 달성'
      WHEN 'top_voter' THEN '100회 이상 투표'
      WHEN 'early_adopter' THEN '초기 회원'
      ELSE '특별 배지'
    END AS badge_description
  FROM public.user_badges b
  WHERE 
    (p_user_id IS NOT NULL AND b.user_id = p_user_id)
    OR (p_user_id IS NULL AND p_ip_address IS NOT NULL AND b.ip_address = p_ip_address::inet)
    OR (p_user_id IS NULL AND p_device_id IS NOT NULL AND b.device_id = p_device_id)
  ORDER BY b.earned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 9: 테스트 쿼리 (검증용)
-- ============================================

-- 출석 체크 테스트 (비로그인 사용자)
-- SELECT handle_attendance_streak(NULL, '192.168.1.1', 'device_abc123');

-- 특정 사용자의 연속 출석일 확인
-- SELECT calculate_attendance_streak('사용자UUID', NULL, NULL);

-- 사용자의 배지 목록 조회
-- SELECT * FROM get_user_badges('사용자UUID', NULL, NULL);

-- 오늘의 출석자 수
-- SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address::text, device_id)) 
-- FROM public.attendance 
-- WHERE attendance_date = CURRENT_DATE;

-- 연속 출석 TOP 10
-- SELECT 
--   COALESCE(user_id::text, ip_address::text, device_id) as identifier,
--   calculate_attendance_streak(user_id, ip_address, device_id) as streak
-- FROM (
--   SELECT DISTINCT user_id, ip_address, device_id
--   FROM public.attendance
--   WHERE attendance_date >= CURRENT_DATE - INTERVAL '30 days'
-- ) AS recent_users
-- ORDER BY streak DESC
-- LIMIT 10;

-- ============================================
-- STEP 10: 데이터 정리 함수 (선택사항)
-- ============================================

-- 90일 이전 출석 기록 정리 (스토리지 최적화)
CREATE OR REPLACE FUNCTION cleanup_old_attendance()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.attendance
  WHERE attendance_date < CURRENT_DATE - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 정리 함수 실행 (선택사항, 주기적으로 실행 권장)
-- SELECT cleanup_old_attendance();

-- ============================================
-- 완료! 아래 명령어로 시스템 작동 확인
-- ============================================

/*
1. 출석 체크:
   SELECT handle_attendance_streak(
     '사용자UUID',  -- 로그인한 경우
     '192.168.1.1', -- IP 주소
     'device_123'   -- 디바이스 ID
   );

2. 연속 출석일 확인:
   SELECT calculate_attendance_streak('사용자UUID', NULL, NULL);

3. 배지 조회:
   SELECT * FROM get_user_badges('사용자UUID', NULL, NULL);

4. 오늘의 통계:
   SELECT 
     COUNT(*) as total_attendance,
     COUNT(DISTINCT user_id) as logged_in_users,
     COUNT(DISTINCT ip_address) as unique_ips
   FROM public.attendance
   WHERE attendance_date = CURRENT_DATE;
*/
