-- ============================================================
-- 프롬프티아 데이터베이스 마이그레이션 스크립트
-- ============================================================
-- 보고서 3장 및 부록 참고
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. pgvector 확장 활성화 (벡터 데이터 저장용)
-- 참고: Supabase에서 이미 활성화되어 있을 수 있습니다
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 기존 테이블 정리 (주의: 데이터가 있다면 백업 후 실행)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.works CASCADE;

-- 3. works 테이블 생성 (작품 정보 및 벡터 데이터)
CREATE TABLE public.works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 기본 정보
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('novel', 'webtoon', 'video')),
  
  -- 미디어
  thumbnail_url TEXT,
  cover_image_url TEXT,
  
  -- 통계
  view_count BIGINT DEFAULT 0 CHECK (view_count >= 0),
  vote_count BIGINT DEFAULT 0 CHECK (vote_count >= 0),
  like_count BIGINT DEFAULT 0 CHECK (like_count >= 0),
  
  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'blocked')),
  is_blocked BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- AI 메타데이터
  prompt_used TEXT,
  creation_intent TEXT,
  worldview_description TEXT,
  ai_model TEXT,
  seed INTEGER,
  steps INTEGER,
  
  -- 벡터 데이터 (임베딩)
  -- pgvector 확장을 사용하여 1536차원 벡터 저장 (OpenAI text-embedding-ada-002)
  embedding vector(1536),
  
  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  published_at TIMESTAMPTZ,
  
  -- 인덱스 최적화를 위한 컬럼
  popularity_score NUMERIC(10, 4) DEFAULT 0,
  last_interaction_at TIMESTAMPTZ DEFAULT now()
);

-- 4. votes 테이블 생성 (투표 정보, IP 및 핑거프린트 포함)
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 관계
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 중복 방지 (IP 및 핑거프린트 기반)
  ip_address INET,
  fingerprint TEXT, -- 클라이언트 핑거프린트 (브라우저/디바이스 식별)
  user_agent TEXT,
  
  -- 투표 타입
  vote_type TEXT DEFAULT 'like' CHECK (vote_type IN ('like', 'dislike', 'pick')),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 중복 방지를 위한 유니크 제약
  -- 같은 work_id에 대해 IP 또는 fingerprint가 동일하면 중복 투표 방지
  CONSTRAINT unique_vote_per_work_ip UNIQUE (work_id, ip_address),
  CONSTRAINT unique_vote_per_work_fingerprint UNIQUE (work_id, fingerprint),
  CONSTRAINT unique_vote_per_work_user UNIQUE (work_id, user_id)
);

-- 5. 인덱스 생성 (성능 최적화)

-- works 테이블 인덱스
CREATE INDEX idx_works_author_id ON public.works(author_id);
CREATE INDEX idx_works_type ON public.works(type);
CREATE INDEX idx_works_status ON public.works(status);
CREATE INDEX idx_works_is_blocked ON public.works(is_blocked);
CREATE INDEX idx_works_is_featured ON public.works(is_featured);
CREATE INDEX idx_works_created_at ON public.works(created_at DESC);
CREATE INDEX idx_works_published_at ON public.works(published_at DESC);
CREATE INDEX idx_works_popularity_score ON public.works(popularity_score DESC);
CREATE INDEX idx_works_last_interaction_at ON public.works(last_interaction_at DESC);
CREATE INDEX idx_works_vote_count ON public.works(vote_count DESC);
CREATE INDEX idx_works_view_count ON public.works(view_count DESC);

-- 벡터 검색을 위한 인덱스 (HNSW 알고리즘 사용)
-- 참고: HNSW는 빠른 근사 검색을 위한 인덱스입니다
CREATE INDEX idx_works_embedding ON public.works 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- GIN 인덱스 (JSONB 및 배열 검색용)
CREATE INDEX idx_works_metadata ON public.works USING GIN (metadata);
CREATE INDEX idx_works_tags ON public.works USING GIN (tags);

-- votes 테이블 인덱스
CREATE INDEX idx_votes_work_id ON public.votes(work_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_ip_address ON public.votes(ip_address);
CREATE INDEX idx_votes_fingerprint ON public.votes(fingerprint);
CREATE INDEX idx_votes_created_at ON public.votes(created_at DESC);
CREATE INDEX idx_votes_work_id_created_at ON public.votes(work_id, created_at DESC);

-- 6. 트리거 함수: 투표 발생 시 vote_count 원자적 증가
CREATE OR REPLACE FUNCTION public.increment_work_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- works 테이블의 vote_count를 원자적으로 증가
  UPDATE public.works
  SET 
    vote_count = vote_count + 1,
    last_interaction_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.work_id;
  
  RETURN NEW;
END;
$$;

-- 7. 트리거: votes 테이블에 INSERT 시 자동으로 vote_count 증가
CREATE TRIGGER trigger_increment_vote_count
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_work_vote_count();

-- 8. 트리거 함수: 투표 삭제 시 vote_count 감소
CREATE OR REPLACE FUNCTION public.decrement_work_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- works 테이블의 vote_count를 원자적으로 감소
  UPDATE public.works
  SET 
    vote_count = GREATEST(vote_count - 1, 0), -- 음수 방지
    updated_at = NOW()
  WHERE id = OLD.work_id;
  
  RETURN OLD;
END;
$$;

-- 9. 트리거: votes 테이블에서 DELETE 시 자동으로 vote_count 감소
CREATE TRIGGER trigger_decrement_vote_count
  AFTER DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_work_vote_count();

-- 10. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 11. works 테이블의 updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_update_works_updated_at
  BEFORE UPDATE ON public.works
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Row Level Security (RLS) 활성화
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 13. RLS 정책: works 테이블

-- 정책 1: 모든 유저가 조회 가능 (blocked되지 않은 작품만)
CREATE POLICY "Anyone can view non-blocked works"
  ON public.works
  FOR SELECT
  USING (
    is_blocked = false 
    AND status IN ('approved', 'pending')
  );

-- 정책 2: 인증된 유저만 업로드 가능
CREATE POLICY "Authenticated users can insert works"
  ON public.works
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 정책 3: 작가만 자신의 작품 수정 가능
CREATE POLICY "Authors can update their own works"
  ON public.works
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 정책 4: 작가만 자신의 작품 삭제 가능
CREATE POLICY "Authors can delete their own works"
  ON public.works
  FOR DELETE
  USING (auth.uid() = author_id);

-- 정책 5: 관리자는 모든 작품 관리 가능 (선택사항)
-- CREATE POLICY "Admins can manage all works"
--   ON public.works
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM auth.users
--       WHERE id = auth.uid()
--         AND (raw_user_meta_data->>'role' = 'admin' 
--              OR raw_app_meta_data->>'role' = 'admin')
--     )
--   );

-- 14. RLS 정책: votes 테이블

-- 정책 1: 모든 유저가 투표 조회 가능
CREATE POLICY "Anyone can view votes"
  ON public.votes
  FOR SELECT
  USING (true);

-- 정책 2: 인증된 유저만 투표 가능 (IP 기반 중복 체크는 제약조건으로 처리)
CREATE POLICY "Authenticated users can insert votes"
  ON public.votes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    -- IP 또는 fingerprint가 제공되어야 함
    AND (ip_address IS NOT NULL OR fingerprint IS NOT NULL)
  );

-- 정책 3: 투표한 유저만 자신의 투표 삭제 가능
CREATE POLICY "Users can delete their own votes"
  ON public.votes
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR ip_address = inet_client_addr()
  );

-- 15. 벡터 검색 함수 (유사도 기반 작품 검색)
CREATE OR REPLACE FUNCTION public.search_similar_works(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  result_limit int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  similarity float,
  vote_count BIGINT,
  view_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.description,
    1 - (w.embedding <=> query_embedding) as similarity,
    w.vote_count,
    w.view_count
  FROM public.works w
  WHERE 
    w.embedding IS NOT NULL
    AND w.is_blocked = false
    AND w.status = 'approved'
    AND 1 - (w.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$;

-- 16. 중복 투표 체크 함수 (IP 및 핑거프린트 기반)
CREATE OR REPLACE FUNCTION public.check_duplicate_vote(
  p_work_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_fingerprint TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- user_id가 있으면 user_id로 먼저 체크
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.votes
      WHERE work_id = p_work_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
      RETURN true;
    END IF;
  END IF;
  
  -- IP 주소로 체크
  IF p_ip_address IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.votes
      WHERE work_id = p_work_id AND ip_address = p_ip_address
    ) INTO v_exists;
    
    IF v_exists THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Fingerprint로 체크
  IF p_fingerprint IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.votes
      WHERE work_id = p_work_id AND fingerprint = p_fingerprint
    ) INTO v_exists;
    
    IF v_exists THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- 17. 주석 추가
COMMENT ON TABLE public.works IS '작품 정보 및 벡터 데이터를 저장하는 테이블';
COMMENT ON TABLE public.votes IS '투표 정보를 저장하는 테이블 (IP 및 핑거프린트 기반 중복 방지)';
COMMENT ON COLUMN public.works.embedding IS 'OpenAI text-embedding-ada-002 벡터 (1536차원)';
COMMENT ON COLUMN public.votes.ip_address IS '투표자의 IP 주소 (중복 투표 방지용)';
COMMENT ON COLUMN public.votes.fingerprint IS '클라이언트 핑거프린트 (브라우저/디바이스 식별)';
COMMENT ON FUNCTION public.increment_work_vote_count() IS '투표 발생 시 works.vote_count를 원자적으로 증가시키는 트리거 함수';
COMMENT ON FUNCTION public.search_similar_works(vector, float, int) IS '벡터 유사도 기반 작품 검색 함수';
COMMENT ON FUNCTION public.check_duplicate_vote(UUID, INET, TEXT, UUID) IS 'IP 및 핑거프린트 기반 중복 투표 체크 함수';

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT 
  '데이터베이스 마이그레이션 완료!' AS result,
  'works 테이블 생성됨' AS works_table,
  'votes 테이블 생성됨' AS votes_table,
  'RLS 정책 적용됨' AS rls_policies,
  '트리거 함수 생성됨' AS triggers;

-- ============================================================
-- 유용한 쿼리 모음
-- ============================================================

-- 벡터 검색 예시 (임베딩 벡터가 있는 경우)
-- SELECT * FROM public.search_similar_works(
--   '[임베딩 벡터 배열]'::vector(1536),
--   0.7,  -- 유사도 임계값
--   10    -- 결과 개수
-- );

-- 중복 투표 체크 예시
-- SELECT public.check_duplicate_vote(
--   'work-uuid'::UUID,
--   '192.168.1.1'::INET,
--   'fingerprint-string',
--   'user-uuid'::UUID
-- );

-- 인기 작품 조회 (투표 수 기준)
-- SELECT * FROM public.works
-- WHERE is_blocked = false AND status = 'approved'
-- ORDER BY vote_count DESC, view_count DESC
-- LIMIT 20;

-- 최근 작품 조회
-- SELECT * FROM public.works
-- WHERE is_blocked = false AND status = 'approved'
-- ORDER BY created_at DESC
-- LIMIT 20;
