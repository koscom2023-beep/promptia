# Vercel 배포 시 필요한 환경 변수 목록

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서 다음 변수들을 추가하세요.

## 필수 환경 변수 (Required)

### 1. NEXT_PUBLIC_SUPABASE_URL
- **설명**: Supabase 프로젝트 URL
- **예시**: `https://xxxxxxxxxxxxx.supabase.co`
- **위치**: Supabase 대시보드 → Settings → API → Project URL
- **필수 여부**: ✅ 필수

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **설명**: Supabase Anonymous Key (공개 키)
- **예시**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **위치**: Supabase 대시보드 → Settings → API → Project API keys → anon public
- **필수 여부**: ✅ 필수

### 3. NEXT_PUBLIC_SITE_URL
- **설명**: 배포된 사이트의 URL (SEO 및 메타데이터용)
- **예시**: `https://your-app.vercel.app` (Vercel 배포 후 자동 생성되는 URL)
- **또는**: 커스텀 도메인 사용 시 `https://yourdomain.com`
- **필수 여부**: ⚠️ 선택 (없으면 기본값 `https://your-domain.com` 사용)

## 환경 변수 설정 방법

1. Vercel 대시보드에 로그인
2. 프로젝트 선택
3. Settings → Environment Variables 이동
4. 각 환경 변수를 추가:
   - **Name**: 변수 이름 (예: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: 변수 값
   - **Environment**: Production, Preview, Development 모두 선택 (또는 필요에 따라 선택)

## 중요 사항

- `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트 사이드에서도 접근 가능합니다.
- 환경 변수 추가 후 **반드시 재배포**해야 적용됩니다.
- Supabase 키는 공개되어도 안전하지만 (Row Level Security로 보호), 그래도 `.env.local` 파일은 Git에 커밋하지 마세요.

## 체크리스트

배포 전 확인:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `NEXT_PUBLIC_SITE_URL` 설정됨 (선택사항)
- [ ] 모든 환경 변수가 Production, Preview, Development에 설정됨
- [ ] 재배포 완료
