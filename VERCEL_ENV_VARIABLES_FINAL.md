# Vercel 환경 변수 설정 가이드 (최종)

## 개요

프롬프티아 배포를 위한 Vercel 환경 변수 설정 가이드입니다.
보안을 위해 클라이언트 노출 여부에 따라 엄격히 분리되어 있습니다.

## 필수 환경 변수

### 클라이언트 노출 변수 (NEXT_PUBLIC_ 접두사)

이 변수들은 브라우저에 노출되므로 공개되어도 안전한 값만 사용합니다.

| 변수명 | 설명 | 예시 | 필수 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (공개 키) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | 사이트 도메인 | `https://your-domain.com` | ✅ |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Google AdSense 클라이언트 ID | `ca-pub-XXXXX` | ⚠️ |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | R2 Public CDN URL | `https://pub-xxxxx.r2.dev` | ⚠️ |

### 서버 전용 변수 (NEXT_PUBLIC_ 접두사 없음)

이 변수들은 서버 사이드에서만 사용되며, 클라이언트에 노출되지 않습니다.
**반드시 "Encrypted"로 설정하세요.**

| 변수명 | 설명 | 예시 | 필수 | Encrypted |
|--------|------|------|------|-----------|
| `R2_ACCOUNT_ID` | Cloudflare R2 계정 ID | `your_account_id` | ⚠️ | ✅ |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID | `your_access_key_id` | ⚠️ | ✅ |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key | `your_secret_access_key` | ⚠️ | ✅ |
| `R2_BUCKET_NAME` | R2 버킷 이름 | `promptia-images` | ⚠️ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ❌ | ✅ |
| `SUPABASE_PROJECT_ID` | Supabase 프로젝트 ID (타입 동기화용) | `your-project-id` | ❌ | ❌ |

## Vercel 설정 방법

### 1. 환경 변수 추가

1. Vercel Dashboard 접속
2. Project 선택 → Settings → Environment Variables
3. "Add New" 클릭
4. 변수명과 값 입력
5. Environment 선택 (Production, Preview, Development)
6. 서버 전용 변수는 "Encrypted" 체크
7. "Save" 클릭

### 2. 권장 설정

#### Production (프로덕션)

```
✅ 모든 필수 변수 설정
✅ 서버 전용 변수는 Encrypted 체크
✅ 실제 프로덕션 값 사용
```

#### Preview (프리뷰)

```
✅ Production과 동일한 변수 설정
✅ 테스트용 값 사용 가능
✅ Encrypted 체크 유지
```

#### Development (개발)

```
⚠️ 로컬 개발용 (.env.local 사용 권장)
⚠️ Vercel Development 환경은 선택사항
```

## 환경 변수별 상세 설명

### NEXT_PUBLIC_SUPABASE_URL

- **위치**: Supabase Dashboard → Settings → API → Project URL
- **용도**: Supabase 클라이언트 초기화
- **보안**: 공개 가능 (프로젝트 URL)

### NEXT_PUBLIC_SUPABASE_ANON_KEY

- **위치**: Supabase Dashboard → Settings → API → Project API keys → anon public
- **용도**: Supabase 클라이언트 인증
- **보안**: 공개 가능 (Anon Key는 RLS로 보호됨)

### NEXT_PUBLIC_SITE_URL

- **설정**: 배포된 도메인 (예: `https://promptia.vercel.app`)
- **용도**: SEO 메타데이터, 사이트맵, OpenGraph
- **보안**: 공개 가능

### NEXT_PUBLIC_ADSENSE_CLIENT_ID

- **위치**: Google AdSense Dashboard → Account → Account information
- **용도**: AdSense 광고 표시
- **보안**: 공개 가능 (클라이언트 ID)

### NEXT_PUBLIC_R2_PUBLIC_URL

- **위치**: Cloudflare R2 Dashboard → Public Bucket → CDN URL
- **용도**: 이미지 CDN URL
- **보안**: 공개 가능 (Public URL)

### R2_ACCOUNT_ID

- **위치**: Cloudflare Dashboard → 우측 하단 계정 정보
- **용도**: R2 API 인증
- **보안**: 서버 전용 (Encrypted 필수)

### R2_ACCESS_KEY_ID

- **위치**: Cloudflare R2 Dashboard → Manage R2 API Tokens
- **용도**: R2 API 인증
- **보안**: 서버 전용 (Encrypted 필수)

### R2_SECRET_ACCESS_KEY

- **위치**: Cloudflare R2 Dashboard → Manage R2 API Tokens (생성 시에만 표시)
- **용도**: R2 API 인증
- **보안**: 서버 전용 (Encrypted 필수, 절대 노출 금지)

### R2_BUCKET_NAME

- **위치**: Cloudflare R2 Dashboard → 버킷 이름
- **용도**: R2 버킷 지정
- **보안**: 서버 전용 (Encrypted 권장)

### SUPABASE_SERVICE_ROLE_KEY

- **위치**: Supabase Dashboard → Settings → API → Project API keys → service_role secret
- **용도**: 관리자 작업 (RLS 우회)
- **보안**: 서버 전용 (Encrypted 필수, 절대 노출 금지)
- **주의**: 클라이언트에서 절대 사용하지 마세요

### SUPABASE_PROJECT_ID

- **위치**: Supabase Dashboard → Settings → General → Reference ID
- **용도**: 타입 동기화 스크립트
- **보안**: 공개 가능 (프로젝트 식별자)

## 보안 체크리스트

배포 전 다음을 확인하세요:

- [ ] `NEXT_PUBLIC_` 접두사는 공개 가능한 값만 사용
- [ ] 서버 전용 변수는 "Encrypted"로 설정
- [ ] `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에서 사용하지 않음
- [ ] `R2_SECRET_ACCESS_KEY`는 절대 노출되지 않음
- [ ] 환경 변수 값이 올바르게 설정됨
- [ ] Production, Preview, Development 환경 모두 설정됨

## 문제 해결

### 환경 변수가 적용되지 않음

1. Vercel Dashboard에서 변수 확인
2. 배포 재시작 (Redeploy)
3. 변수명 대소문자 확인
4. Environment 선택 확인

### 빌드 실패 (환경 변수 오류)

1. 필수 변수 확인
2. 변수명 오타 확인
3. 빌드 로그 확인
4. 로컬에서 `.env.local` 테스트

### 클라이언트에서 서버 전용 변수 접근 시도

1. 에러 메시지 확인
2. `NEXT_PUBLIC_` 접두사 확인
3. 서버 사이드 코드로 이동

## 참고 자료

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
