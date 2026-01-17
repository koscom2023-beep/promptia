-- 신고 테이블 생성 및 로그 기록 시스템
-- Supabase SQL Editor에서 실행하세요

-- 기존 reports 테이블이 있다면 삭제 (주의: 데이터가 있다면 백업 후 실행)
DROP TABLE IF EXISTS reports CASCADE;

-- reports 테이블 생성 (법적 감사 추적을 위한 로그 시스템)
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- 신고 사유 (copyright, inappropriate, spam, other)
  details TEXT NOT NULL, -- 상세 내용
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'rejected')),
  reported_at TIMESTAMPTZ DEFAULT NOW(), -- 신고 접수 시간 (법적 증거용)
  processed_at TIMESTAMPTZ, -- 처리 완료 시간 (법적 증거용)
  admin_action TEXT, -- 조치 내용 (deleted, blocked, rejected, no_action)
  admin_notes TEXT, -- 운영자 메모
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_reports_novel_id ON public.reports(novel_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_reported_at ON public.reports(reported_at);
CREATE INDEX idx_reports_processed_at ON public.reports(processed_at);

-- RLS (Row Level Security) 설정
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 신고를 생성할 수 있음
CREATE POLICY "누구나 신고 가능" ON public.reports FOR INSERT WITH CHECK (true);

-- 모든 사용자가 자신의 신고를 조회할 수 있음 (선택사항)
CREATE POLICY "신고 조회 가능" ON public.reports FOR SELECT USING (true);

-- 관리자용 함수: 신고 처리 (블라인드 처리)
CREATE OR REPLACE FUNCTION process_report_block(
  report_id UUID,
  novel_id_param UUID,
  admin_notes_param TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- 작품 블라인드 처리
  UPDATE public.novels
  SET is_blocked = true
  WHERE id = novel_id_param;

  -- 신고 처리 완료 기록 (법적 증거용)
  UPDATE public.reports
  SET 
    status = 'resolved',
    processed_at = NOW(),
    admin_action = 'blocked',
    admin_notes = admin_notes_param,
    updated_at = NOW()
  WHERE id = report_id;
END;
$$ LANGUAGE plpgsql;

-- 관리자용 함수: 신고 처리 (삭제)
CREATE OR REPLACE FUNCTION process_report_delete(
  report_id UUID,
  novel_id_param UUID,
  admin_notes_param TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- 작품 삭제 (CASCADE로 episodes, votes, comments도 자동 삭제됨)
  DELETE FROM public.novels
  WHERE id = novel_id_param;

  -- 신고 처리 완료 기록 (법적 증거용)
  UPDATE public.reports
  SET 
    status = 'resolved',
    processed_at = NOW(),
    admin_action = 'deleted',
    admin_notes = admin_notes_param,
    updated_at = NOW()
  WHERE id = report_id;
END;
$$ LANGUAGE plpgsql;

-- 관리자용 함수: 신고 반려
CREATE OR REPLACE FUNCTION process_report_reject(
  report_id UUID,
  admin_notes_param TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- 신고 반려 기록 (법적 증거용)
  UPDATE public.reports
  SET 
    status = 'rejected',
    processed_at = NOW(),
    admin_action = 'rejected',
    admin_notes = admin_notes_param,
    updated_at = NOW()
  WHERE id = report_id;
END;
$$ LANGUAGE plpgsql;

-- 법적 감사 리포트 조회 함수 (신고 접수 후 처리까지의 시간 계산)
CREATE OR REPLACE FUNCTION get_legal_audit_report(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  report_id UUID,
  novel_id UUID,
  novel_title TEXT,
  reason TEXT,
  reported_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  processing_time_minutes NUMERIC,
  admin_action TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id AS report_id,
    r.novel_id,
    n.title AS novel_title,
    r.reason,
    r.reported_at,
    r.processed_at,
    CASE 
      WHEN r.processed_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (r.processed_at - r.reported_at)) / 60
      ELSE NULL
    END AS processing_time_minutes,
    r.admin_action,
    r.status
  FROM public.reports r
  LEFT JOIN public.novels n ON r.novel_id = n.id
  WHERE r.reported_at BETWEEN start_date AND end_date
  ORDER BY r.reported_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
SELECT '신고 테이블 및 로그 기록 시스템 생성 완료!' AS result;
