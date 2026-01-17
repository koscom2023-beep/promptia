-- ============================================================
-- 프롬프티아 게이미피케이션 시스템 구축 스크립트
-- ============================================================
-- Phase 2: 경험치(XP), 연속 기록(Streak), 업적 시스템
-- ============================================================
-- 실행 방법: Supabase SQL Editor에서 전체 스크립트를 복사하여 실행
-- ============================================================

-- 1. 기존 테이블 정리 (필요시)
DROP TRIGGER IF EXISTS update_gamification_on_activity ON public.activity_logs;
DROP FUNCTION IF EXISTS public.update_gamification_profile() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_user_streak(uuid) CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.gamification_profiles CASCADE;

-- 2. gamification_profiles 테이블 생성
-- 사용자의 게이미피케이션 프로필 정보 저장
CREATE TABLE public.gamification_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  total_xp BIGINT DEFAULT 0 NOT NULL CHECK (total_xp >= 0),
  weekly_xp BIGINT DEFAULT 0 NOT NULL CHECK (weekly_xp >= 0),
  level INTEGER DEFAULT 1 NOT NULL CHECK (level >= 1),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_gamification_profiles_level ON public.gamification_profiles(level DESC);
CREATE INDEX idx_gamification_profiles_total_xp ON public.gamification_profiles(total_xp DESC);
CREATE INDEX idx_gamification_profiles_current_streak ON public.gamification_profiles(current_streak DESC);
CREATE INDEX idx_gamification_profiles_weekly_xp ON public.gamification_profiles(weekly_xp DESC);

-- 3. achievements 테이블 생성
-- 업적 메타데이터 저장 (예: "첫 댓글 작성", "10일 연속 접속" 등)
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 업적 코드 (예: 'first_comment', 'streak_10')
  name TEXT NOT NULL, -- 업적 이름 (예: '첫 댓글 작성')
  description TEXT, -- 업적 설명
  icon_url TEXT, -- 업적 아이콘 URL
  xp_reward BIGINT DEFAULT 0 NOT NULL CHECK (xp_reward >= 0), -- 업적 달성 시 보상 XP
  category TEXT, -- 업적 카테고리 (예: 'comment', 'streak', 'vote')
  is_active BOOLEAN DEFAULT true NOT NULL, -- 활성화 여부
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_achievements_code ON public.achievements(code);
CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_active ON public.achievements(is_active) WHERE is_active = true;

-- 4. user_achievements 테이블 생성
-- 유저-업적 매핑 (유저가 달성한 업적 기록)
CREATE TABLE public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id) -- 한 유저가 같은 업적을 중복 달성할 수 없음
);

-- 인덱스 생성
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);

-- 5. activity_logs 테이블 생성
-- 유저 활동 기록용 불변 로그 (Immutable Log)
-- 모든 활동은 이 테이블에 기록되며, 삭제되지 않음
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 활동 유형 (예: 'comment', 'vote', 'upload', 'daily_login')
  xp_earned BIGINT DEFAULT 0 NOT NULL CHECK (xp_earned >= 0), -- 이 활동으로 획득한 XP
  metadata JSONB DEFAULT '{}'::jsonb, -- 추가 메타데이터 (예: 작품 ID, 댓글 ID 등)
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 활동 날짜 (시간 제외)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_date ON public.activity_logs(activity_date DESC);
CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, activity_date DESC);
CREATE INDEX idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- 6. Streak 계산 함수
-- 'Gaps and Islands' 공식을 활용해 실제 연속 날짜를 정확히 계산
CREATE OR REPLACE FUNCTION public.calculate_user_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_today DATE := CURRENT_DATE;
  v_has_activity_today BOOLEAN := false;
BEGIN
  -- 오늘 활동이 있는지 확인
  SELECT EXISTS (
    SELECT 1 
    FROM public.activity_logs 
    WHERE user_id = p_user_id 
      AND activity_date = v_today
  ) INTO v_has_activity_today;

  -- 오늘 활동이 없으면 streak는 0
  IF NOT v_has_activity_today THEN
    RETURN 0;
  END IF;

  -- Gaps and Islands 알고리즘을 사용한 연속 날짜 계산
  -- 각 활동 날짜에 대해 그룹 번호를 할당하고, 연속된 날짜를 찾음
  WITH activity_dates AS (
    SELECT DISTINCT activity_date
    FROM public.activity_logs
    WHERE user_id = p_user_id
      AND activity_date <= v_today
    ORDER BY activity_date DESC
  ),
  date_groups AS (
    SELECT 
      activity_date,
      activity_date - ROW_NUMBER() OVER (ORDER BY activity_date DESC)::INTEGER AS date_group
    FROM activity_dates
  ),
  consecutive_days AS (
    SELECT 
      date_group,
      MIN(activity_date) AS start_date,
      MAX(activity_date) AS end_date,
      COUNT(*) AS days_count
    FROM date_groups
    GROUP BY date_group
    ORDER BY start_date DESC
  )
  SELECT days_count
  INTO v_streak
  FROM consecutive_days
  WHERE end_date = v_today
  LIMIT 1;

  -- streak가 NULL이면 0 반환
  RETURN COALESCE(v_streak, 0);
END;
$$;

-- 7. 게이미피케이션 프로필 업데이트 함수
-- activity_logs에 새로운 행이 추가될 때마다 호출됨
CREATE OR REPLACE FUNCTION public.update_gamification_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_activity_date DATE;
  v_current_activity_date DATE;
  v_new_streak INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
  v_xp_for_next_level BIGINT;
  v_total_xp BIGINT;
  v_weekly_xp BIGINT;
BEGIN
  -- 활동 날짜 확인
  v_current_activity_date := NEW.activity_date;
  
  -- 프로필이 없으면 생성
  INSERT INTO public.gamification_profiles (user_id, last_activity_at)
  VALUES (NEW.user_id, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- 마지막 활동 날짜 가져오기
  SELECT last_activity_at::DATE
  INTO v_last_activity_date
  FROM public.gamification_profiles
  WHERE user_id = NEW.user_id;

  -- XP 업데이트
  UPDATE public.gamification_profiles
  SET 
    total_xp = total_xp + NEW.xp_earned,
    weekly_xp = CASE 
      WHEN activity_date >= CURRENT_DATE - INTERVAL '7 days' 
      THEN weekly_xp + NEW.xp_earned
      ELSE NEW.xp_earned
    END,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- 레벨 계산 (레벨 공식: level = floor(sqrt(total_xp / 100)) + 1)
  SELECT 
    total_xp,
    weekly_xp,
    level
  INTO v_total_xp, v_weekly_xp, v_current_level
  FROM public.gamification_profiles
  WHERE user_id = NEW.user_id;

  v_new_level := FLOOR(SQRT(v_total_xp / 100.0))::INTEGER + 1;

  -- 레벨이 올랐으면 업데이트
  IF v_new_level > v_current_level THEN
    UPDATE public.gamification_profiles
    SET level = v_new_level
    WHERE user_id = NEW.user_id;
  END IF;

  -- Streak 계산 및 업데이트
  -- 동일 날짜 활동이면 streak는 변경하지 않음 (XP만 추가)
  -- 날짜가 바뀌었다면 streak 계산
  IF v_last_activity_date IS NULL OR v_current_activity_date > v_last_activity_date THEN
    -- 새로운 날짜이므로 streak 재계산
    v_new_streak := public.calculate_user_streak(NEW.user_id);
    
    UPDATE public.gamification_profiles
    SET 
      current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 8. 트리거 생성
-- activity_logs에 새로운 행이 추가될 때마다 게이미피케이션 프로필 업데이트
CREATE TRIGGER update_gamification_on_activity
  AFTER INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gamification_profile();

-- 9. 주간 XP 리셋 함수 (매주 월요일 자동 실행용)
CREATE OR REPLACE FUNCTION public.reset_weekly_xp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gamification_profiles
  SET weekly_xp = 0
  WHERE weekly_xp > 0;
  
  RAISE NOTICE '주간 XP 리셋 완료: %', NOW();
END;
$$;

-- 10. Row Level Security (RLS) 정책 설정

-- gamification_profiles RLS
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;

-- 유저가 자신의 프로필만 조회 가능
CREATE POLICY "Users can view their own gamification profile"
  ON public.gamification_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 유저가 자신의 프로필만 업데이트 가능 (트리거를 통해서만)
CREATE POLICY "Users can update their own gamification profile"
  ON public.gamification_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- achievements RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 모든 유저가 활성화된 업적 목록 조회 가능
CREATE POLICY "Anyone can view active achievements"
  ON public.achievements
  FOR SELECT
  USING (is_active = true);

-- user_achievements RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 유저가 자신의 업적만 조회 가능
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- 유저가 자신의 업적만 삽입 가능 (서버 사이드에서만)
CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- activity_logs RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 유저가 자신의 활동 로그만 조회 가능
CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 유저가 자신의 활동 로그만 삽입 가능 (서버 사이드에서만)
CREATE POLICY "Users can insert their own activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. 초기 업적 데이터 삽입 (예시)
INSERT INTO public.achievements (code, name, description, xp_reward, category) VALUES
  ('first_comment', '첫 댓글 작성', '첫 번째 댓글을 작성했습니다.', 50, 'comment'),
  ('first_vote', '첫 투표', '첫 번째 투표를 했습니다.', 30, 'vote'),
  ('first_upload', '첫 업로드', '첫 번째 작품을 업로드했습니다.', 100, 'upload'),
  ('streak_3', '3일 연속 접속', '3일 연속으로 접속했습니다.', 50, 'streak'),
  ('streak_7', '7일 연속 접속', '7일 연속으로 접속했습니다.', 150, 'streak'),
  ('streak_30', '30일 연속 접속', '30일 연속으로 접속했습니다.', 500, 'streak'),
  ('level_5', '레벨 5 달성', '레벨 5에 도달했습니다.', 200, 'level'),
  ('level_10', '레벨 10 달성', '레벨 10에 도달했습니다.', 500, 'level'),
  ('level_20', '레벨 20 달성', '레벨 20에 도달했습니다.', 1000, 'level'),
  ('comment_master', '댓글 마스터', '100개의 댓글을 작성했습니다.', 300, 'comment'),
  ('voter_master', '투표 마스터', '100개의 투표를 했습니다.', 200, 'vote')
ON CONFLICT (code) DO NOTHING;

-- 12. 주석 추가
COMMENT ON TABLE public.gamification_profiles IS '사용자의 게이미피케이션 프로필 정보 (XP, Streak, Level)';
COMMENT ON TABLE public.achievements IS '업적 메타데이터 (업적 목록)';
COMMENT ON TABLE public.user_achievements IS '유저가 달성한 업적 기록';
COMMENT ON TABLE public.activity_logs IS '유저 활동 기록 (불변 로그)';
COMMENT ON FUNCTION public.calculate_user_streak(uuid) IS 'Gaps and Islands 알고리즘을 사용한 연속 날짜 계산';
COMMENT ON FUNCTION public.update_gamification_profile() IS 'activity_logs 삽입 시 게이미피케이션 프로필 자동 업데이트';
COMMENT ON FUNCTION public.reset_weekly_xp() IS '주간 XP 리셋 (매주 월요일 실행)';

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT 
  '게이미피케이션 시스템 구축 완료!' AS result,
  COUNT(*) AS total_achievements
FROM public.achievements;

-- ============================================================
-- 유용한 쿼리 모음
-- ============================================================

-- 사용자 프로필 조회
-- SELECT * FROM gamification_profiles WHERE user_id = 'user-uuid';

-- 사용자 업적 조회
-- SELECT 
--   ua.unlocked_at,
--   a.name,
--   a.description,
--   a.xp_reward
-- FROM user_achievements ua
-- JOIN achievements a ON ua.achievement_id = a.id
-- WHERE ua.user_id = 'user-uuid'
-- ORDER BY ua.unlocked_at DESC;

-- 사용자 활동 로그 조회
-- SELECT * FROM activity_logs 
-- WHERE user_id = 'user-uuid' 
-- ORDER BY created_at DESC 
-- LIMIT 50;

-- Streak 수동 계산
-- SELECT calculate_user_streak('user-uuid');

-- 레벨별 사용자 수
-- SELECT level, COUNT(*) as user_count
-- FROM gamification_profiles
-- GROUP BY level
-- ORDER BY level DESC;

-- 주간 XP 리셋 (수동 실행)
-- SELECT reset_weekly_xp();
