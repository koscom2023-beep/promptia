-- 중력 기반 랭킹 시스템 설정 스크립트
-- Supabase SQL Editor에서 실행하세요
-- 주의: create_tables_final.sql을 먼저 실행한 후 이 스크립트를 실행하세요

-- 1. 기존 Materialized View 삭제 (있는 경우)
DROP MATERIALIZED VIEW IF EXISTS public.realtime_ranking CASCADE;

-- 2. 중력 기반 랭킹 Materialized View 생성
-- 공식: Score = ((V × 1) + (L × 5) + (P × 10) - 1) / (T + 2)^1.8
-- V: view_count (조회수)
-- L: 좋아요 (현재는 vote_count로 대체, 추후 별도 컬럼 추가 가능)
-- P: vote_count (투표수)
-- T: 경과 시간 (시간 단위)
CREATE MATERIALIZED VIEW public.realtime_ranking AS
SELECT 
  n.id,
  n.title,
  n.description,
  n.type,
  n.thumbnail_url,
  n.view_count,
  n.vote_count,
  n.created_at,
  -- 중력 기반 랭킹 점수 계산
  CASE 
    WHEN n.view_count IS NULL AND n.vote_count IS NULL THEN 0
    ELSE (
      ((COALESCE(n.view_count, 0) * 1) + 
       (COALESCE(n.vote_count, 0) * 5) + 
       (COALESCE(n.vote_count, 0) * 10) - 1) / 
      NULLIF(POWER((EXTRACT(EPOCH FROM (NOW() - n.created_at)) / 3600.0 + 2), 1.8), 0)
    )
  END AS gravity_score
FROM public.novels n
WHERE n.type IS NOT NULL
ORDER BY gravity_score DESC;

-- 3. 인덱스 생성 (빠른 조회를 위해)
-- CONCURRENTLY 옵션 사용을 위해 UNIQUE 인덱스 필요
CREATE UNIQUE INDEX IF NOT EXISTS idx_realtime_ranking_id ON public.realtime_ranking(id);
CREATE INDEX IF NOT EXISTS idx_realtime_ranking_type ON public.realtime_ranking(type);
CREATE INDEX IF NOT EXISTS idx_realtime_ranking_score ON public.realtime_ranking(gravity_score DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_ranking_created ON public.realtime_ranking(created_at);

-- 4. Materialized View 갱신 함수
CREATE OR REPLACE FUNCTION refresh_realtime_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- UNIQUE 인덱스가 있으므로 CONCURRENTLY 옵션 사용 가능 (다른 쿼리 블로킹 없음)
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.realtime_ranking;
END;
$$;

-- 5. RLS 정책 추가 (Materialized View는 테이블처럼 조회 가능)
-- Materialized View는 기본적으로 조회 가능하지만, 명시적으로 정책 추가
-- 참고: Materialized View는 RLS를 직접 지원하지 않으므로, 
-- 기본 novels 테이블의 RLS 정책이 적용됩니다.

-- 6. 초기 데이터로 Materialized View 채우기
REFRESH MATERIALIZED VIEW public.realtime_ranking;

-- 완료 메시지
SELECT '중력 기반 랭킹 시스템 설정 완료!' AS result;

-- 7. pg_cron 설정 (Supabase Pro 플랜에서만 사용 가능)
-- 주의: Supabase 무료 플랜에서는 pg_cron이 비활성화되어 있을 수 있습니다.
-- 대신 Supabase Edge Functions나 외부 cron 서비스를 사용하세요.

-- pg_cron이 활성화되어 있다면 다음 명령으로 5분마다 자동 갱신 설정:
-- SELECT cron.schedule(
--   'refresh-ranking-every-5min',
--   '*/5 * * * *',  -- 5분마다
--   'SELECT refresh_realtime_ranking();'
-- );

-- pg_cron 스케줄 확인:
-- SELECT * FROM cron.job WHERE jobname = 'refresh-ranking-every-5min';

-- pg_cron 스케줄 삭제 (필요시):
-- SELECT cron.unschedule('refresh-ranking-every-5min');
