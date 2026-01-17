-- ============================================
-- Deep Auth & 프로필 자동화 시스템
-- 프롬프티아 MVP 2단계
-- ============================================
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- STEP 1: profiles 테이블 생성
-- ============================================

DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  bio TEXT,
  
  -- 게이미피케이션 필드
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  total_works_uploaded INTEGER DEFAULT 0,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_level ON public.profiles(level DESC);
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);

-- ============================================
-- STEP 2: 자동 프로필 생성 트리거 (Deep Auth)
-- ============================================

-- 트리거 함수: auth.users에 유저 생성 시 자동으로 public.profiles 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    avatar_url,
    role,
    created_at,
    updated_at,
    last_active_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 3: 프로필 업데이트 트리거 (이메일 동기화)
-- ============================================

-- auth.users의 이메일이 변경되면 profiles도 자동 업데이트
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- STEP 4: RLS (Row Level Security) 정책
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사람이 프로필을 조회할 수 있음 (공개 정보)
CREATE POLICY "프로필 조회 가능"
ON public.profiles FOR SELECT
USING (true);

-- 본인만 자신의 프로필을 수정할 수 있음
CREATE POLICY "본인 프로필 수정 가능"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 프로필 삭제는 본인만 가능
CREATE POLICY "본인 프로필 삭제 가능"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- ============================================
-- STEP 5: 프로필 조회 및 업데이트 함수
-- ============================================

-- 현재 사용자 프로필 조회
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS public.profiles AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자 레벨 계산 함수 (XP 기반)
CREATE OR REPLACE FUNCTION calculate_user_level(xp_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- 레벨 공식: FLOOR(SQRT(XP / 100))
  -- 예: 0-99 XP = Level 1, 100-399 XP = Level 2, 400-899 XP = Level 3
  RETURN GREATEST(1, FLOOR(SQRT(xp_points / 100.0)) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- XP 증가 함수
CREATE OR REPLACE FUNCTION add_xp_to_user(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity_type TEXT DEFAULT 'unknown'
)
RETURNS JSON AS $$
DECLARE
  v_old_xp INTEGER;
  v_new_xp INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_level_up BOOLEAN := FALSE;
BEGIN
  -- 현재 XP와 레벨 조회
  SELECT xp, level INTO v_old_xp, v_old_level
  FROM public.profiles
  WHERE id = p_user_id;

  -- XP 추가
  v_new_xp := v_old_xp + p_xp_amount;
  v_new_level := calculate_user_level(v_new_xp);
  
  -- 레벨업 여부 확인
  IF v_new_level > v_old_level THEN
    v_level_up := TRUE;
  END IF;

  -- 프로필 업데이트
  UPDATE public.profiles
  SET 
    xp = v_new_xp,
    level = v_new_level,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'oldXp', v_old_xp,
    'newXp', v_new_xp,
    'oldLevel', v_old_level,
    'newLevel', v_new_level,
    'levelUp', v_level_up,
    'activityType', p_activity_type
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: 활동 기록 자동 업데이트
-- ============================================

-- novels 테이블에 작품 추가 시 프로필의 total_works_uploaded 증가
CREATE OR REPLACE FUNCTION increment_works_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_works_uploaded = total_works_uploaded + 1,
    updated_at = NOW()
  WHERE id = NEW.author_id;
  
  -- XP 보상: 작품 업로드 시 50 XP
  PERFORM add_xp_to_user(NEW.author_id, 50, 'work_upload');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_works ON public.novels;

CREATE TRIGGER trigger_increment_works
  AFTER INSERT ON public.novels
  FOR EACH ROW
  WHEN (NEW.author_id IS NOT NULL)
  EXECUTE FUNCTION increment_works_count();

-- votes 테이블에 투표 추가 시 프로필의 total_votes_cast 증가
CREATE OR REPLACE FUNCTION increment_votes_count()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- voter의 user_id 추출 (컬럼이 있다면)
  v_user_id := NEW.user_id;
  
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      total_votes_cast = total_votes_cast + 1,
      updated_at = NOW()
    WHERE id = v_user_id;
    
    -- XP 보상: 투표 시 5 XP
    PERFORM add_xp_to_user(v_user_id, 5, 'vote');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_votes ON public.votes;

CREATE TRIGGER trigger_increment_votes
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_votes_count();

-- ============================================
-- STEP 7: 관리자 권한 설정 함수
-- ============================================

-- 특정 사용자를 관리자로 승격
CREATE OR REPLACE FUNCTION set_user_admin(
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET 
    role = 'admin',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- auth.users의 메타데이터도 업데이트 (선택사항)
  UPDATE auth.users
  SET 
    raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 8: 테스트 쿼리
-- ============================================

/*
-- 모든 프로필 조회
SELECT * FROM public.profiles ORDER BY created_at DESC;

-- 관리자 목록
SELECT * FROM public.profiles WHERE role = 'admin';

-- 레벨 TOP 10
SELECT username, level, xp, total_works_uploaded, total_votes_cast
FROM public.profiles
ORDER BY level DESC, xp DESC
LIMIT 10;

-- 특정 사용자를 관리자로 승격 (USER_ID를 실제 UUID로 교체)
SELECT set_user_admin('USER_ID');

-- 현재 로그인한 사용자 프로필
SELECT * FROM get_current_user_profile();
*/

-- ============================================
-- STEP 9: 기존 사용자를 위한 프로필 생성 (마이그레이션)
-- ============================================

-- 이미 가입한 사용자가 있다면 프로필 생성
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'user'),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- ============================================
-- 완료! 인증 시스템 준비 완료
-- ============================================

-- 확인: 모든 사용자가 프로필을 가지고 있는지
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✅ 모든 사용자에게 프로필이 있습니다'
    ELSE '⚠️ 일부 사용자에게 프로필이 없습니다'
  END as status;
