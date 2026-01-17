-- ============================================
-- RBAC 관리자 시스템 & 보안 가드
-- 프롬프티아 MVP 4단계
-- ============================================
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- STEP 1: app_role ENUM 타입 생성
-- ============================================

-- ENUM 타입 생성 (역할 정의)
DROP TYPE IF EXISTS app_role CASCADE;

CREATE TYPE app_role AS ENUM (
  'user',        -- 일반 사용자
  'moderator',   -- 모더레이터 (신고 검토)
  'admin',       -- 관리자 (모든 권한)
  'banned'       -- 차단된 사용자
);

-- ============================================
-- STEP 2: profiles 테이블에 role 컬럼 추가/수정
-- ============================================

-- 기존 role 컬럼이 TEXT라면 ENUM으로 변경
-- 주의: 데이터가 있다면 변환 작업 필요
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS role;

ALTER TABLE public.profiles 
ADD COLUMN role app_role DEFAULT 'user' NOT NULL;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- STEP 3: 관리자 권한 체크 함수
-- ============================================

-- 현재 사용자가 관리자인지 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현재 사용자가 관리자인지 확인 (RLS 정책용)
CREATE OR REPLACE FUNCTION check_user_role(required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: 관리자 권한이 필요한 테이블 RLS 정책
-- ============================================

-- reports 테이블: 관리자만 모든 신고를 조회/수정 가능
DROP POLICY IF EXISTS "관리자 신고 조회" ON public.reports;
DROP POLICY IF EXISTS "관리자 신고 수정" ON public.reports;

CREATE POLICY "관리자 신고 조회"
ON public.reports FOR SELECT
USING (is_admin());

CREATE POLICY "관리자 신고 수정"
ON public.reports FOR UPDATE
USING (is_admin());

-- novels 테이블: 관리자는 모든 작품 조회/수정/삭제 가능
DROP POLICY IF EXISTS "관리자 작품 관리" ON public.novels;

CREATE POLICY "관리자 작품 관리"
ON public.novels FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================
-- STEP 5: 관리자 전용 함수 (신고 처리)
-- ============================================

-- 신고된 작품 목록 조회 (관리자 전용)
CREATE OR REPLACE FUNCTION get_reported_novels(
  p_status TEXT DEFAULT 'pending',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  novel_id UUID,
  novel_title TEXT,
  novel_type TEXT,
  report_id UUID,
  report_reason TEXT,
  report_details TEXT,
  report_status TEXT,
  reported_at TIMESTAMPTZ,
  reporter_count BIGINT
) AS $$
BEGIN
  -- 관리자 권한 체크
  IF NOT is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  RETURN QUERY
  SELECT 
    n.id AS novel_id,
    n.title AS novel_title,
    n.type AS novel_type,
    r.id AS report_id,
    r.reason AS report_reason,
    r.details AS report_details,
    r.status AS report_status,
    r.reported_at,
    -- 동일 작품에 대한 신고 수
    (SELECT COUNT(*) 
     FROM public.reports r2 
     WHERE r2.novel_id = n.id 
       AND r2.status = 'pending') AS reporter_count
  FROM public.reports r
  INNER JOIN public.novels n ON r.novel_id = n.id
  WHERE 
    (p_status = 'all' OR r.status = p_status)
  ORDER BY 
    r.reported_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 작품 삭제 (관리자 전용)
CREATE OR REPLACE FUNCTION admin_delete_novel(
  p_novel_id UUID,
  p_reason TEXT
)
RETURNS JSON AS $$
DECLARE
  v_deleted_title TEXT;
BEGIN
  -- 관리자 권한 체크
  IF NOT is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  -- 삭제 전 제목 저장 (로그용)
  SELECT title INTO v_deleted_title
  FROM public.novels
  WHERE id = p_novel_id;

  -- 작품 삭제 (CASCADE로 episodes, votes, comments도 자동 삭제)
  DELETE FROM public.novels WHERE id = p_novel_id;

  -- 관련 신고 모두 해결 처리
  UPDATE public.reports
  SET 
    status = 'resolved',
    processed_at = NOW(),
    admin_action = 'deleted',
    admin_notes = p_reason
  WHERE novel_id = p_novel_id
    AND status = 'pending';

  RETURN json_build_object(
    'success', true,
    'deletedTitle', v_deleted_title,
    'novelId', p_novel_id,
    'reason', p_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 신고 반려 (관리자 전용)
CREATE OR REPLACE FUNCTION admin_reject_report(
  p_report_id UUID,
  p_admin_notes TEXT
)
RETURNS void AS $$
BEGIN
  -- 관리자 권한 체크
  IF NOT is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  UPDATE public.reports
  SET 
    status = 'rejected',
    processed_at = NOW(),
    admin_action = 'no_action',
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: 대시보드 통계 함수 (관리자 전용)
-- ============================================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  -- 관리자 권한 체크
  IF NOT is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.profiles),
    'totalNovels', (SELECT COUNT(*) FROM public.novels),
    'totalVotes', (SELECT COUNT(*) FROM public.votes),
    'totalComments', (SELECT COUNT(*) FROM public.comments),
    'pendingReports', (SELECT COUNT(*) FROM public.reports WHERE status = 'pending'),
    'todayUsers', (SELECT COUNT(*) FROM public.profiles WHERE DATE(created_at) = CURRENT_DATE),
    'todayNovels', (SELECT COUNT(*) FROM public.novels WHERE DATE(created_at) = CURRENT_DATE),
    'todayVotes', (SELECT COUNT(*) FROM public.votes WHERE DATE(created_at) = CURRENT_DATE),
    'adminCount', (SELECT COUNT(*) FROM public.profiles WHERE role IN ('admin', 'moderator')),
    'bannedCount', (SELECT COUNT(*) FROM public.profiles WHERE role = 'banned')
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 7: 사용자 차단 함수 (관리자 전용)
-- ============================================

CREATE OR REPLACE FUNCTION admin_ban_user(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS void AS $$
BEGIN
  -- 관리자 권한 체크
  IF NOT is_admin() THEN
    RAISE EXCEPTION '관리자 권한이 필요합니다.';
  END IF;

  -- 사용자 차단
  UPDATE public.profiles
  SET 
    role = 'banned',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- 해당 사용자의 모든 작품 차단
  UPDATE public.novels
  SET is_blocked = true
  WHERE author_id = p_user_id;

  -- 로그 기록 (reports 테이블 활용)
  INSERT INTO public.reports (novel_id, reason, details, status, admin_action)
  SELECT 
    id, 
    'user_banned', 
    p_reason, 
    'resolved', 
    'user_banned'
  FROM public.novels
  WHERE author_id = p_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 8: 테스트 쿼리
-- ============================================

/*
-- 관리자 권한 확인
SELECT is_admin();

-- 특정 사용자를 관리자로 승격
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';

-- 또는 함수 사용 (create_auth_profiles_system.sql의 함수)
SELECT set_user_admin('사용자_UUID');

-- 신고된 작품 목록
SELECT * FROM get_reported_novels('pending', 20);

-- 대시보드 통계
SELECT * FROM get_admin_dashboard_stats();

-- 작품 삭제
SELECT admin_delete_novel('작품_UUID', '유해 콘텐츠 포함');

-- 신고 반려
SELECT admin_reject_report('신고_UUID', '정상 콘텐츠로 확인됨');

-- 사용자 차단
SELECT admin_ban_user('사용자_UUID', '반복적인 규정 위반');
*/

-- ============================================
-- STEP 9: 관리자 목록 조회
-- ============================================

-- 현재 관리자 목록 확인
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  last_active_at
FROM public.profiles
WHERE role IN ('admin', 'moderator')
ORDER BY created_at ASC;

-- ============================================
-- 완료! RBAC 시스템 준비 완료
-- ============================================

-- 첫 관리자 계정 생성 방법:
-- 1. 일반 회원가입 후
-- 2. Supabase SQL Editor에서 실행:
/*
UPDATE public.profiles
SET role = 'admin'
WHERE email = '당신의이메일@example.com';
*/
