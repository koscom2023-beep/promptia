-- FCM 토큰 테이블 생성
-- 보고서 7장: 마케팅 자동화 - 푸시 알림

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 사용자가 여러 기기에서 알림을 받을 수 있으므로
  -- user_id와 token의 조합이 유니크해야 함
  UNIQUE (user_id, token)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(token);

-- RLS 활성화
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 토큰만 조회/수정/삭제 가능
CREATE POLICY "Users can manage their own FCM tokens"
  ON public.fcm_tokens
  FOR ALL
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_fcm_tokens_updated_at
  BEFORE UPDATE ON public.fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_fcm_tokens_updated_at();
