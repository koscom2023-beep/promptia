-- 프롬프티아 데이터베이스 테이블 생성 스크립트 (수정 완료)
-- Supabase SQL Editor에서 실행하세요

-- 기존 테이블 삭제 (에러 무시하고 실행됨)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;
DROP TABLE IF EXISTS novels CASCADE;

-- 1. novels 테이블 생성
CREATE TABLE public.novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('novel', 'webtoon')),
  cover_image_url TEXT,
  view_count BIGINT DEFAULT 0,
  hidden BOOLEAN DEFAULT false,
  prompt_used TEXT,
  creation_intent TEXT,
  worldview_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. episodes 테이블 생성 (수정 완료)
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- 소설용 텍스트 내용
  image_urls JSONB DEFAULT '[]'::jsonb, -- ★ 수정: 빈 배열로 초기화 (웹툰용)
  episode_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT episodes_novel_id_episode_number_key UNIQUE (novel_id, episode_number)
);

-- 3. votes 테이블 생성
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT votes_episode_ip_unique UNIQUE (episode_id, ip_address)
);

-- 4. comments 테이블 생성
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_novels_category ON public.novels(category);
CREATE INDEX idx_novels_created_at ON public.novels(created_at DESC);
CREATE INDEX idx_novels_hidden ON public.novels(hidden) WHERE hidden = false;
CREATE INDEX idx_episodes_novel_id ON public.episodes(novel_id);
CREATE INDEX idx_episodes_episode_number ON public.episodes(novel_id, episode_number);
CREATE INDEX idx_votes_episode_id ON public.votes(episode_id);
CREATE INDEX idx_votes_novel_id ON public.votes(novel_id);
CREATE INDEX idx_comments_episode_id ON public.comments(episode_id);

-- 조회수 증가 함수 생성
CREATE OR REPLACE FUNCTION increment_novel_view_count(p_novel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.novels
  SET view_count = view_count + 1
  WHERE id = p_novel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료 메시지
SELECT '테이블 생성 완료! novels, episodes, votes, comments 테이블이 생성되었습니다.' AS result;
