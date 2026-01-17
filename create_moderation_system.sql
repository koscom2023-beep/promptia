-- ============================================
-- AI 자동 검수 파이프라인 시스템
-- 프롬프티아 로드맵 6장
-- ============================================
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- STEP 1: novels 테이블에 검수 관련 컬럼 추가
-- ============================================

-- status 컬럼: pending(검수대기), approved(승인), flagged(유해), rejected(반려)
ALTER TABLE public.novels
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected')),
ADD COLUMN IF NOT EXISTS moderation_result JSONB, -- OpenAI Moderation API 결과 저장
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ, -- 검수 완료 시각
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false; -- 차단 여부

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_novels_status ON public.novels(status);
CREATE INDEX IF NOT EXISTS idx_novels_is_blocked ON public.novels(is_blocked);
CREATE INDEX IF NOT EXISTS idx_novels_moderated_at ON public.novels(moderated_at);

-- ============================================
-- STEP 2: 검수 로그 테이블 생성 (감사 추적용)
-- ============================================

DROP TABLE IF EXISTS public.moderation_logs CASCADE;

CREATE TABLE public.moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('novel', 'episode', 'comment')),
  content_preview TEXT, -- 검수한 내용 미리보기 (최대 500자)
  moderation_result JSONB NOT NULL, -- OpenAI API 전체 응답
  flagged BOOLEAN NOT NULL, -- 유해 여부
  flagged_categories TEXT[], -- 유해 카테고리 배열
  auto_action TEXT CHECK (auto_action IN ('approved', 'flagged', 'blocked')), -- 자동 조치
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_moderation_logs_novel_id ON public.moderation_logs(novel_id);
CREATE INDEX idx_moderation_logs_flagged ON public.moderation_logs(flagged);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);

-- ============================================
-- STEP 3: 자동 검수 트리거 함수
-- ============================================

-- 작품 INSERT/UPDATE 시 자동으로 검수 대기 상태로 변경
CREATE OR REPLACE FUNCTION auto_set_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로 생성된 작품은 기본적으로 pending 상태
  IF TG_OP = 'INSERT' THEN
    NEW.status := COALESCE(NEW.status, 'pending');
    NEW.is_blocked := true; -- 검수 전까지는 차단 (안전 우선)
  END IF;

  -- title 또는 description이 변경되면 재검수 필요
  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title 
       OR NEW.description IS DISTINCT FROM OLD.description THEN
      NEW.status := 'pending';
      NEW.moderated_at := NULL; -- 재검수 필요
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_moderation_status ON public.novels;
CREATE TRIGGER trigger_auto_moderation_status
  BEFORE INSERT OR UPDATE ON public.novels
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_moderation_status();

-- ============================================
-- STEP 4: 관리자용 검수 큐 조회 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_moderation_queue(
  p_status TEXT DEFAULT 'flagged',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  novel_id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  author_id UUID,
  status TEXT,
  moderation_result JSONB,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  flagged_categories TEXT,
  report_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id AS novel_id,
    n.title,
    n.description,
    n.type,
    n.author_id,
    n.status,
    n.moderation_result,
    n.moderated_at,
    n.created_at,
    -- 검출된 유해 카테고리 추출
    CASE 
      WHEN n.moderation_result IS NOT NULL THEN
        (SELECT string_agg(key, ', ')
         FROM jsonb_each(n.moderation_result->'categories')
         WHERE value::boolean = true)
      ELSE NULL
    END AS flagged_categories,
    -- 해당 작품에 대한 신고 수
    (SELECT COUNT(*) 
     FROM public.reports r 
     WHERE r.novel_id = n.id 
       AND r.status = 'pending') AS report_count
  FROM public.novels n
  WHERE 
    (p_status = 'all' OR n.status = p_status)
    AND n.status IN ('flagged', 'pending')
  ORDER BY 
    CASE WHEN n.status = 'flagged' THEN 1 ELSE 2 END, -- flagged 우선
    n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: 일반 사용자용 필터링 강화
-- ============================================

-- RLS 정책 업데이트: 승인된 작품만 조회 가능
DROP POLICY IF EXISTS "모두 조회 가능1" ON public.novels;

CREATE POLICY "승인된 작품만 조회 가능" 
ON public.novels FOR SELECT 
USING (
  status = 'approved' 
  AND (is_blocked IS NULL OR is_blocked = false)
);

-- 작가는 자신의 작품을 항상 볼 수 있음
CREATE POLICY "작가는 자신의 작품 조회 가능" 
ON public.novels FOR SELECT 
USING (
  auth.uid() = author_id
);

-- 관리자는 모든 작품 조회 가능
CREATE POLICY "관리자는 모든 작품 조회 가능" 
ON public.novels FOR SELECT 
USING (
  (auth.jwt()->>'role')::text = 'admin'
  OR (auth.jwt()->'user_metadata'->>'role')::text = 'admin'
  OR (auth.jwt()->'app_metadata'->>'role')::text = 'admin'
);

-- ============================================
-- STEP 6: 검수 통계 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'totalNovels', (SELECT COUNT(*) FROM public.novels),
    'pendingReview', (SELECT COUNT(*) FROM public.novels WHERE status = 'pending'),
    'flaggedByAI', (SELECT COUNT(*) FROM public.novels WHERE status = 'flagged'),
    'approved', (SELECT COUNT(*) FROM public.novels WHERE status = 'approved'),
    'rejected', (SELECT COUNT(*) FROM public.novels WHERE status = 'rejected'),
    'todayFlagged', (SELECT COUNT(*) FROM public.novels 
                     WHERE status = 'flagged' 
                       AND moderated_at >= CURRENT_DATE),
    'avgModerationTime', (SELECT EXTRACT(EPOCH FROM AVG(moderated_at - created_at))/60
                          FROM public.novels 
                          WHERE moderated_at IS NOT NULL)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: 관리자 승인/반려 함수
-- ============================================

CREATE OR REPLACE FUNCTION admin_approve_novel(
  p_novel_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.novels
  SET 
    status = 'approved',
    is_blocked = false,
    updated_at = NOW()
  WHERE id = p_novel_id;

  -- 관련 신고 모두 해결 처리
  UPDATE public.reports
  SET 
    status = 'resolved',
    processed_at = NOW(),
    admin_action = 'approved',
    admin_notes = p_admin_notes
  WHERE novel_id = p_novel_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_reject_novel(
  p_novel_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.novels
  SET 
    status = 'rejected',
    is_blocked = true,
    updated_at = NOW()
  WHERE id = p_novel_id;

  -- 관련 신고 모두 해결 처리
  UPDATE public.reports
  SET 
    status = 'resolved',
    processed_at = NOW(),
    admin_action = 'rejected',
    admin_notes = p_admin_notes
  WHERE novel_id = p_novel_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 8: 테스트 쿼리
-- ============================================

/*
-- 검수 큐 조회
SELECT * FROM get_moderation_queue('flagged', 10);

-- 검수 통계
SELECT * FROM get_moderation_stats();

-- 작품 승인
SELECT admin_approve_novel('작품UUID', '내용 확인 후 승인');

-- 작품 반려
SELECT admin_reject_novel('작품UUID', '유해 콘텐츠 포함');

-- 검수 로그 조회
SELECT * FROM public.moderation_logs 
WHERE flagged = true 
ORDER BY created_at DESC 
LIMIT 20;
*/

-- ============================================
-- 완료! 시스템 작동 확인
-- ============================================

-- 현재 검수 대기 중인 작품 수
SELECT 
  status,
  COUNT(*) as count
FROM public.novels
GROUP BY status;
