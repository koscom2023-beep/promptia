-- 계층형 댓글 시스템 및 평판 시스템 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. comments 테이블에 parent_id 컬럼 추가 (자기 참조)
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- parent_id에 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- 2. profiles 테이블 생성 (평판 시스템)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  reputation_score INTEGER DEFAULT 0,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- profiles 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON public.profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_badge ON public.profiles(badge);

-- 3. 뱃지 업데이트 함수 (평판 점수에 따라 자동으로 뱃지 부여)
CREATE OR REPLACE FUNCTION update_user_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- 평판 점수에 따라 뱃지 자동 업데이트
  NEW.badge := CASE
    WHEN NEW.reputation_score >= 10000 THEN 'legend'
    WHEN NEW.reputation_score >= 5000 THEN 'master'
    WHEN NEW.reputation_score >= 2000 THEN 'expert'
    WHEN NEW.reputation_score >= 1000 THEN 'veteran'
    WHEN NEW.reputation_score >= 500 THEN 'advanced'
    WHEN NEW.reputation_score >= 100 THEN 'intermediate'
    WHEN NEW.reputation_score >= 50 THEN 'beginner'
    ELSE NULL
  END;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_badge ON public.profiles;
CREATE TRIGGER trigger_update_badge
  BEFORE UPDATE OF reputation_score ON public.profiles
  FOR EACH ROW
  WHEN (OLD.reputation_score IS DISTINCT FROM NEW.reputation_score)
  EXECUTE FUNCTION update_user_badge();

-- 4. 재귀 쿼리를 사용한 대댓글 조회 함수
CREATE OR REPLACE FUNCTION get_comments_with_replies(novel_id_param UUID)
RETURNS TABLE (
  id UUID,
  novel_id UUID,
  user_nickname TEXT,
  content TEXT,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  depth INTEGER,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- 루트 댓글 (parent_id가 NULL인 댓글)
    SELECT 
      c.id,
      c.novel_id,
      c.user_nickname,
      c.content,
      c.parent_id,
      c.created_at,
      0 AS depth,
      c.id::TEXT AS path
    FROM public.comments c
    WHERE c.novel_id = novel_id_param
      AND c.parent_id IS NULL
    
    UNION ALL
    
    -- 대댓글 (재귀)
    SELECT 
      c.id,
      c.novel_id,
      c.user_nickname,
      c.content,
      c.parent_id,
      c.created_at,
      ct.depth + 1 AS depth,
      ct.path || ' > ' || c.id::TEXT AS path
    FROM public.comments c
    INNER JOIN comment_tree ct ON c.parent_id = ct.id
    WHERE ct.depth < 3  -- 최대 3단계까지만 (3단계 이상은 평면화)
  )
  SELECT 
    ct.id,
    ct.novel_id,
    ct.user_nickname,
    ct.content,
    ct.parent_id,
    ct.created_at,
    ct.depth,
    ct.path
  FROM comment_tree ct
  ORDER BY 
    -- 루트 댓글은 created_at으로 정렬
    CASE WHEN ct.parent_id IS NULL THEN ct.created_at END ASC,
    -- 대댓글은 path로 정렬 (부모-자식 순서 유지)
    ct.path ASC;
END;
$$ LANGUAGE plpgsql;

-- 5. 댓글 작성 시 평판 점수 증가 함수
CREATE OR REPLACE FUNCTION increment_reputation_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- 댓글 작성 시 +5점
  -- profiles 테이블에 사용자가 없으면 생성
  INSERT INTO public.profiles (id, reputation_score)
  VALUES (
    COALESCE((SELECT author_id FROM public.novels WHERE id = NEW.novel_id), gen_random_uuid()),
    5
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    reputation_score = profiles.reputation_score + 5;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (댓글 작성 시 평판 점수 증가)
DROP TRIGGER IF EXISTS trigger_increment_reputation_comment ON public.comments;
CREATE TRIGGER trigger_increment_reputation_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION increment_reputation_on_comment();

-- 6. 투표 시 평판 점수 증가 함수 (votes 테이블 기준)
-- 참고: 현재 votes 테이블에는 user_id가 없으므로, 
-- 추후 user_id 컬럼이 추가되면 아래 함수를 사용할 수 있습니다.

-- CREATE OR REPLACE FUNCTION increment_reputation_on_vote()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- 투표 시 +10점
--   INSERT INTO public.profiles (id, reputation_score)
--   VALUES (NEW.user_id, 10)
--   ON CONFLICT (id) 
--   DO UPDATE SET 
--     reputation_score = profiles.reputation_score + 10;
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- 7. RLS 정책 추가
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- profiles 조회 정책 (모두 조회 가능)
CREATE POLICY "모두 조회 가능 profiles" ON public.profiles FOR SELECT USING (true);

-- profiles 업데이트 정책 (본인만 수정 가능)
CREATE POLICY "본인만 수정 가능 profiles" ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 8. 완료 메시지
SELECT '계층형 댓글 시스템 및 평판 시스템 설정 완료!' AS result;
