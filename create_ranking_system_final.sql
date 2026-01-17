-- ============================================================
-- 프롬프티아 중력 기반 랭킹 시스템 최종 구축 스크립트
-- ============================================================
-- 보고서 4.1절의 공식 적용
-- 공식: Score = ((V × 1) + (L × 5) + (P × 10) - 1) / (T + 2)^1.8
--   V: view_count (조회수, 가중치 1)
--   L: 좋아요 (현재는 vote_count로 대체, 가중치 5)
--   P: vote_count (투표수, 가중치 10)
--   T: 경과 시간 (시간 단위, 지수 1.8)
-- ============================================================
-- 실행 방법: Supabase SQL Editor에서 전체 스크립트를 복사하여 실행
-- ============================================================

-- 1. 기존 Materialized View 및 관련 객체 정리
DROP MATERIALIZED VIEW IF EXISTS public.realtime_ranking CASCADE;
DROP FUNCTION IF EXISTS public.refresh_realtime_ranking() CASCADE;

-- 2. 중력 기반 랭킹 Materialized View 생성
-- 최근 30일 이내의 작품만 대상으로 하여 성능 최적화
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
  n.is_blocked,
  -- 중력 기반 랭킹 점수 계산
  -- 공식: ((V × 1) + (L × 5) + (P × 10) - 1) / (T_hours + 2)^1.8
  CASE 
    -- 분모가 0이 되는 경우 방지
    WHEN NULLIF(POWER((EXTRACT(EPOCH FROM (NOW() - n.created_at)) / 3600.0 + 2), 1.8), 0) IS NULL THEN 0
    -- 점수 계산
    ELSE (
      ((COALESCE(n.view_count, 0) * 1) +           -- V: 조회수 (가중치 1)
       (COALESCE(n.vote_count, 0) * 5) +           -- L: 좋아요 (가중치 5, 현재는 vote_count로 대체)
       (COALESCE(n.vote_count, 0) * 10) - 1) /    -- P: 투표수 (가중치 10)
      NULLIF(POWER((EXTRACT(EPOCH FROM (NOW() - n.created_at)) / 3600.0 + 2), 1.8), 0)
    )
  END AS gravity_score
FROM public.novels n
WHERE 
  n.type IS NOT NULL
  AND n.created_at > NOW() - INTERVAL '30 days'  -- 최근 30일 이내 작품만 대상
  AND (n.is_blocked IS NULL OR n.is_blocked = false)  -- 차단된 작품 제외
ORDER BY gravity_score DESC;

-- 3. 성능 최적화를 위한 인덱스 생성
-- UNIQUE 인덱스는 CONCURRENTLY 갱신을 위해 필수
CREATE UNIQUE INDEX IF NOT EXISTS idx_realtime_ranking_id ON public.realtime_ranking(id);
CREATE INDEX IF NOT EXISTS idx_realtime_ranking_type ON public.realtime_ranking(type);
CREATE INDEX IF NOT EXISTS idx_realtime_ranking_score ON public.realtime_ranking(gravity_score DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_ranking_created ON public.realtime_ranking(created_at);
CREATE INDEX IF NOT EXISTS idx_realtime_ranking_blocked ON public.realtime_ranking(is_blocked) WHERE is_blocked = false;

-- 4. Materialized View 소유자 설정
ALTER MATERIALIZED VIEW public.realtime_ranking OWNER TO postgres;

-- 5. Materialized View 갱신 함수 생성
-- CONCURRENTLY 옵션을 사용하여 갱신 중에도 조회 가능
CREATE OR REPLACE FUNCTION refresh_realtime_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- UNIQUE 인덱스가 있으므로 CONCURRENTLY 옵션 사용 가능
  -- 이 옵션은 갱신 중에도 다른 쿼리가 뷰를 조회할 수 있게 해줍니다
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.realtime_ranking;
  
  -- 갱신 시간 로그 (선택사항)
  RAISE NOTICE '랭킹 Materialized View 갱신 완료: %', NOW();
END;
$$;

-- 6. 초기 데이터로 Materialized View 채우기
REFRESH MATERIALIZED VIEW public.realtime_ranking;

-- 7. pg_cron 자동 갱신 스케줄 설정
-- 주의: Supabase에서는 pg_cron 확장이 활성화되어 있어야 합니다
-- Supabase 대시보드 -> Database -> Extensions에서 "pg_cron" 활성화 필요
-- 무료 플랜에서는 pg_cron이 비활성화되어 있을 수 있습니다

-- pg_cron 확장 활성화 (이미 활성화되어 있으면 무시됨)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 스케줄이 있다면 삭제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-ranking-every-5min'
  ) THEN
    PERFORM cron.unschedule('refresh-ranking-every-5min');
    RAISE NOTICE '기존 스케줄 삭제됨: refresh-ranking-every-5min';
  END IF;
END $$;

-- 5분마다 자동 갱신 스케줄 생성
-- cron 표현식: '*/5 * * * *' = 매 5분마다
SELECT cron.schedule(
  'refresh-ranking-every-5min',
  '*/5 * * * *',  -- 5분마다 실행
  $$SELECT refresh_realtime_ranking();$$
);

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT 
  '중력 기반 랭킹 시스템 구축 완료!' AS result,
  COUNT(*) AS total_ranked_items,
  COUNT(*) FILTER (WHERE type = 'novel') AS novel_count,
  COUNT(*) FILTER (WHERE type = 'webtoon') AS webtoon_count,
  COUNT(*) FILTER (WHERE type = 'video') AS video_count
FROM public.realtime_ranking;

-- ============================================================
-- 유용한 쿼리 모음
-- ============================================================

-- 랭킹 조회 예시 (TOP 10)
-- SELECT * FROM realtime_ranking ORDER BY gravity_score DESC LIMIT 10;

-- 카테고리별 랭킹 조회 (소설)
-- SELECT * FROM realtime_ranking WHERE type = 'novel' ORDER BY gravity_score DESC LIMIT 10;

-- 카테고리별 랭킹 조회 (웹툰)
-- SELECT * FROM realtime_ranking WHERE type = 'webtoon' ORDER BY gravity_score DESC LIMIT 10;

-- 카테고리별 랭킹 조회 (영상)
-- SELECT * FROM realtime_ranking WHERE type = 'video' ORDER BY gravity_score DESC LIMIT 10;

-- 수동 갱신 (필요시)
-- SELECT refresh_realtime_ranking();

-- pg_cron 스케줄 확인
-- SELECT * FROM cron.job WHERE jobname = 'refresh-ranking-every-5min';

-- pg_cron 스케줄 삭제 (필요시)
-- SELECT cron.unschedule('refresh-ranking-every-5min');

-- Materialized View 통계 확인
-- SELECT * FROM pg_stat_user_tables WHERE relname = 'realtime_ranking';

-- 랭킹 점수 분포 확인
-- SELECT 
--   CASE 
--     WHEN gravity_score >= 1000 THEN 'Very High'
--     WHEN gravity_score >= 100 THEN 'High'
--     WHEN gravity_score >= 10 THEN 'Medium'
--     WHEN gravity_score >= 1 THEN 'Low'
--     ELSE 'Very Low'
--   END AS score_range,
--   COUNT(*) AS count
-- FROM realtime_ranking
-- GROUP BY score_range
-- ORDER BY MIN(gravity_score) DESC;
