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
  ('재벌집 막내 AI', '재벌가 막내아들의 몸에 AI가 빙의했다.', 'novel', 'https://via.placeholder.com/300x400', 3400, 1200),
  ('던전 밥 짓는 AI', 'S급 헌터도 반한 AI 쉐프.', 'webtoon', 'https://via.placeholder.com/300x400', 560, 150),
  ('알고리즘의 황제', '주식 시장을 지배하는 천재.', 'novel', 'https://via.placeholder.com/300x400', 120, 30);

-- 에피소드 자동 생성 (수정된 부분: '' 대신 '[]' 사용)
INSERT INTO episodes (novel_id, title, content, image_urls)
SELECT id, '제1화: 프롤로그', '이것은 테스트 내용입니다. 재미있는 소설이 시작됩니다.', '[]'::jsonb
FROM novels;

-- 완료 메시지
SELECT '테이블 생성 및 데이터 삽입 완료!' AS result;
