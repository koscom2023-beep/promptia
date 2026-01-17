-- 프롬프티아 데이터베이스 테이블 생성 스크립트 (최종 수정 완료)
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 꼬인 것들 싹 정리 (에러 무시하고 실행됨)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;
DROP TABLE IF EXISTS novels CASCADE;

-- 2. 테이블 만들기
CREATE TABLE public.novels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID,
  type TEXT CHECK (type IN ('novel', 'webtoon', 'video')),
  thumbnail_url TEXT,
  view_count BIGINT DEFAULT 0,
  vote_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, 
  image_urls JSONB DEFAULT '[]'::jsonb, -- ★ 수정: 빈 문자열('') 대신 빈 배열('[]') 사용
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE,
  user_nickname TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 보안 풀기 (누구나 볼 수 있게)
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모두 조회 가능1" ON public.novels FOR SELECT USING (true);
CREATE POLICY "모두 조회 가능2" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "모두 조회 가능3" ON public.votes FOR SELECT USING (true);
CREATE POLICY "모두 조회 가능4" ON public.comments FOR SELECT USING (true);
CREATE POLICY "누구나 투표 가능" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "누구나 댓글 가능" ON public.comments FOR INSERT WITH CHECK (true);

-- 4. 데이터 채우기
INSERT INTO novels (title, description, type, thumbnail_url, view_count, vote_count)
VALUES
  ('회귀했더니 AI가 내 비서?', '망한 개발자, 10년 전으로 돌아가다.', 'novel', 'https://via.placeholder.com/300x400', 1200, 450),
  ('사이버펑크 조선', '네온 사인 아래 한양의 밤.', 'webtoon', 'https://via.placeholder.com/300x400', 890, 320),
  ('재벌집 막내 AI', '재벌가 막내아들의 몸에 AI가 빙의했다.', 'novel', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80', 3400, 1200),
  ('던전 밥 짓는 AI', 'S급 헌터도 반한 AI 쉐프.', 'webtoon', 'https://via.placeholder.com/300x400', 560, 150),
  ('알고리즘의 황제', '주식 시장을 지배하는 천재.', 'novel', 'https://via.placeholder.com/300x400', 120, 30);

-- 에피소드 자동 생성 (수정된 부분: '' 대신 '[]' 사용)
INSERT INTO episodes (novel_id, title, content, image_urls)
SELECT id, '제1화: 프롤로그', '이것은 테스트 내용입니다. 재미있는 소설이 시작됩니다.', '[]'::jsonb
FROM novels;

-- 5. 중력 기반 랭킹을 위한 Materialized View 생성
-- 공식: Score = ((V × 1) + (L × 5) + (P × 10) - 1) / (T + 2)^1.8
-- V: view_count, L: 좋아요(현재는 vote_count로 대체), P: vote_count, T: 경과 시간(시간 단위)

DROP MATERIALIZED VIEW IF EXISTS public.realtime_ranking CASCADE;

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
  -- T: 생성 후 경과 시간 (시간 단위)
  -- L(좋아요)는 현재 vote_count로 대체 (추후 별도 컬럼 추가 가능)
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

-- 인덱스 생성 (빠른 조회를 위해)
-- CONCURRENTLY 옵션 사용을 위해 UNIQUE 인덱스 필요
CREATE UNIQUE INDEX idx_realtime_ranking_id ON public.realtime_ranking(id);
CREATE INDEX idx_realtime_ranking_type ON public.realtime_ranking(type);
CREATE INDEX idx_realtime_ranking_score ON public.realtime_ranking(gravity_score DESC);
CREATE INDEX idx_realtime_ranking_created ON public.realtime_ranking(created_at);

-- Materialized View에 대한 RLS 정책
ALTER MATERIALIZED VIEW public.realtime_ranking OWNER TO postgres;

-- 6. Materialized View 갱신 함수
CREATE OR REPLACE FUNCTION refresh_realtime_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.realtime_ranking;
END;
$$;

-- 7. pg_cron 확장 활성화 (Supabase에서는 직접 지원하지 않을 수 있으므로 주석 처리)
-- pg_cron이 활성화되어 있다면 다음 명령으로 5분마다 자동 갱신 설정:
-- SELECT cron.schedule('refresh-ranking', '*/5 * * * *', 'SELECT refresh_realtime_ranking();');

-- 완료 메시지
SELECT '테이블 생성, 데이터 삽입, 랭킹 시스템 구축 완료!' AS result;
