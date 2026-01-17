-- ============================================================
-- 프롬프티아 운영 자동화 시스템 구축 스크립트
-- ============================================================
-- Phase 2: AI 모더레이션, 주기적 리셋, 명예의 전당
-- ============================================================
-- 실행 방법: Supabase SQL Editor에서 전체 스크립트를 복사하여 실행
-- ============================================================

-- 1. 명예의 전당 테이블 생성
DROP TABLE IF EXISTS public.hall_of_fame CASCADE;

CREATE TABLE public.hall_of_fame (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- 주간 시작일 (월요일)
  weekly_xp BIGINT NOT NULL CHECK (weekly_xp >= 0), -- 해당 주간 XP
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3), -- 순위 (1-3위)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(week_start_date, rank) -- 같은 주에 같은 순위는 하나만
);

-- 인덱스 생성
CREATE INDEX idx_hall_of_fame_user_id ON public.hall_of_fame(user_id);
CREATE INDEX idx_hall_of_fame_week_start ON public.hall_of_fame(week_start_date DESC);
CREATE INDEX idx_hall_of_fame_rank ON public.hall_of_fame(rank);

-- 2. 모더레이션 로그 테이블 생성 (선택사항)
DROP TABLE IF EXISTS public.moderation_logs CASCADE;

CREATE TABLE public.moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT, -- 모더레이션 사유
  flagged_categories JSONB, -- 감지된 카테고리 (예: {"sexual": true, "violence": false})
  category_scores JSONB, -- 카테고리 점수
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_moderation_logs_novel_id ON public.moderation_logs(novel_id);
CREATE INDEX idx_moderation_logs_status ON public.moderation_logs(status);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);

-- 3. 주간 리셋 함수
-- 매주 월요일 00:00에 실행되어 상위 3명을 명예의 전당에 기록하고 weekly_xp를 리셋
CREATE OR REPLACE FUNCTION public.process_weekly_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start_date DATE;
  v_top_users RECORD;
  v_rank INTEGER;
BEGIN
  -- 이번 주 월요일 날짜 계산
  v_week_start_date := DATE_TRUNC('week', CURRENT_DATE)::DATE;

  -- 기존 명예의 전당 기록 확인 (중복 방지)
  IF EXISTS (
    SELECT 1 FROM public.hall_of_fame 
    WHERE week_start_date = v_week_start_date
  ) THEN
    RAISE NOTICE '이미 처리된 주입니다: %', v_week_start_date;
    RETURN;
  END IF;

  -- 주간 XP 상위 3명 조회 및 기록
  -- DISTINCT ON을 사용하여 동일 XP 처리
  WITH ranked_users AS (
    SELECT DISTINCT ON (weekly_xp)
      user_id,
      weekly_xp,
      ROW_NUMBER() OVER (ORDER BY weekly_xp DESC, created_at ASC) as rank_num
    FROM public.gamification_profiles
    WHERE weekly_xp > 0
    ORDER BY weekly_xp DESC, created_at ASC
    LIMIT 3
  )
  INSERT INTO public.hall_of_fame (
    user_id,
    week_start_date,
    weekly_xp,
    rank
  )
  SELECT 
    user_id,
    v_week_start_date,
    weekly_xp,
    rank_num::INTEGER
  FROM ranked_users
  ON CONFLICT (week_start_date, rank) DO NOTHING;

  -- 기록된 명예의 전당 개수 확인
  SELECT COUNT(*) INTO v_recorded_count
  FROM public.hall_of_fame
  WHERE week_start_date = v_week_start_date;

  -- 기록된 명예의 전당 로그
  FOR v_rank IN 1..3 LOOP
    SELECT user_id, weekly_xp
    INTO v_top_users
    FROM public.hall_of_fame
    WHERE week_start_date = v_week_start_date
      AND rank = v_rank
    LIMIT 1;

    IF FOUND THEN
      RAISE NOTICE '명예의 전당 기록: 순위 %, 유저 %, XP %', 
        v_rank, v_top_users.user_id, v_top_users.weekly_xp;
    END IF;
  END LOOP;

  -- 모든 유저의 weekly_xp를 0으로 초기화
  UPDATE public.gamification_profiles
  SET weekly_xp = 0
  WHERE weekly_xp > 0;

  RAISE NOTICE '주간 리셋 완료: 날짜 %, 명예의 전당 기록 %명, XP 리셋 완료', 
    v_week_start_date, v_recorded_count;
END;
$$;

-- 4. pg_cron 스케줄 설정
-- 매주 월요일 00:00에 주간 리셋 실행

-- pg_cron 확장 활성화 (이미 활성화되어 있으면 무시됨)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 스케줄이 있다면 삭제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'weekly-reset-monday'
  ) THEN
    PERFORM cron.unschedule('weekly-reset-monday');
    RAISE NOTICE '기존 스케줄 삭제됨: weekly-reset-monday';
  END IF;
END $$;

-- 매주 월요일 00:00에 실행
-- cron 표현식: '0 0 * * 1' = 매주 월요일 00:00
SELECT cron.schedule(
  'weekly-reset-monday',
  '0 0 * * 1',  -- 매주 월요일 00:00
  $$SELECT public.process_weekly_reset();$$
);

-- 5. 수동 실행 함수 (테스트용)
CREATE OR REPLACE FUNCTION public.manual_weekly_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.process_weekly_reset();
END;
$$;

-- 6. Row Level Security (RLS) 정책 설정

-- hall_of_fame RLS
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;

-- 모든 유저가 명예의 전당 조회 가능
CREATE POLICY "Anyone can view hall of fame"
  ON public.hall_of_fame
  FOR SELECT
  USING (true);

-- moderation_logs RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 모더레이션 로그 조회 가능 (또는 모든 유저가 자신의 작품 로그만 조회)
CREATE POLICY "Users can view moderation logs for their own works"
  ON public.moderation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.novels 
      WHERE novels.id = moderation_logs.novel_id 
        AND novels.author_id = auth.uid()
    )
  );

-- 7. 주석 추가
COMMENT ON TABLE public.hall_of_fame IS '주간 XP 상위 3명 명예의 전당';
COMMENT ON TABLE public.moderation_logs IS 'AI 모더레이션 로그';
COMMENT ON FUNCTION public.process_weekly_reset() IS '매주 월요일 자동 실행되는 주간 리셋 함수';
COMMENT ON FUNCTION public.manual_weekly_reset() IS '수동 주간 리셋 함수 (테스트용)';

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT 
  '운영 자동화 시스템 구축 완료!' AS result,
  COUNT(*) AS total_gamification_profiles
FROM public.gamification_profiles;

-- ============================================================
-- 유용한 쿼리 모음
-- ============================================================

-- 명예의 전당 조회 (최근 4주)
-- SELECT 
--   hof.week_start_date,
--   hof.rank,
--   hof.weekly_xp,
--   u.email
-- FROM hall_of_fame hof
-- JOIN auth.users u ON hof.user_id = u.id
-- ORDER BY hof.week_start_date DESC, hof.rank ASC
-- LIMIT 12;

-- 주간 리셋 수동 실행 (테스트용)
-- SELECT manual_weekly_reset();

-- pg_cron 스케줄 확인
-- SELECT * FROM cron.job WHERE jobname = 'weekly-reset-monday';

-- pg_cron 스케줄 삭제 (필요시)
-- SELECT cron.unschedule('weekly-reset-monday');

-- 모더레이션 로그 조회
-- SELECT * FROM moderation_logs 
-- ORDER BY created_at DESC 
-- LIMIT 50;

-- 주간 XP 상위 10명 (현재 주)
-- SELECT 
--   user_id,
--   weekly_xp,
--   total_xp,
--   level
-- FROM gamification_profiles
-- WHERE weekly_xp > 0
-- ORDER BY weekly_xp DESC
-- LIMIT 10;
