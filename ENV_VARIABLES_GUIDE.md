# 환경 변수 가이드

## 개요

프롬프티아의 환경 변수는 보안을 위해 클라이언트 노출 여부에 따라 엄격히 분리되어 있습니다.

## 환경 변수 분류

### 클라이언트 노출 변수 (NEXT_PUBLIC_ 접두사)

이 변수들은 브라우저에 노출되므로 공개되어도 안전한 값만 사용합니다.

```env
# Supabase (공개 키만 사용)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# AdSense (공개 클라이언트 ID)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXX

# R2 Public URL (CDN URL, 공개 가능)
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**주의사항:**
- `NEXT_PUBLIC_` 접두사가 붙은 변수는 브라우저 번들에 포함됩니다
- 절대 비밀 키나 서비스 롤 키를 포함하지 마세요
- 공개 저장소에 커밋해도 안전한 값만 사용하세요

### 서버 전용 변수 (NEXT_PUBLIC_ 접두사 없음)

이 변수들은 서버 사이드에서만 사용되며, 클라이언트에 노출되지 않습니다.

```env
# R2 인증 정보 (서버 전용)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=promptia-images

# Supabase Service Role Key (서버 전용, 관리자 작업용)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 기타 서버 전용 변수
DATABASE_URL=postgresql://...
```

**주의사항:**
- 이 변수들은 절대 클라이언트 코드에서 사용하지 마세요
- `.env.local` 파일에 저장하고 `.gitignore`에 포함하세요
- Vercel 환경 변수 설정에서도 "Encrypted"로 설정하세요

## 환경 변수 목록

### 필수 변수

#### 클라이언트 노출 (NEXT_PUBLIC_)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (공개 키) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_SITE_URL` | 사이트 도메인 | `https://your-domain.com` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Google AdSense 클라이언트 ID | `ca-pub-XXXXX` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | R2 Public CDN URL | `https://pub-xxxxx.r2.dev` |

#### 서버 전용

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `R2_ACCOUNT_ID` | Cloudflare R2 계정 ID | `your_account_id` |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID | `your_access_key_id` |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key | `your_secret_access_key` |
| `R2_BUCKET_NAME` | R2 버킷 이름 | `promptia-images` |

### 선택적 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (관리자 작업용) | 없음 |

## 사용 위치

### 클라이언트 컴포넌트

```typescript
// ✅ 올바른 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ❌ 잘못된 사용 (서버 전용 변수)
const secretKey = process.env.R2_SECRET_ACCESS_KEY; // 클라이언트에서 사용 불가
```

### 서버 컴포넌트 / Server Actions

```typescript
// ✅ 올바른 사용
const r2Secret = process.env.R2_SECRET_ACCESS_KEY; // 서버에서만 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // 클라이언트 노출 가능
```

## Vercel 배포 설정

### 환경 변수 추가 방법

1. Vercel Dashboard → Project → Settings → Environment Variables
2. 변수 추가 시 다음을 확인:
   - **Environment**: Production, Preview, Development 선택
   - **Encrypted**: 서버 전용 변수는 반드시 체크
   - **Value**: 실제 값 입력

### 권장 설정

```
Production:
  - 모든 필수 변수 설정
  - Encrypted 체크 (서버 전용 변수)

Preview:
  - Production과 동일한 변수 설정
  - 테스트용 값 사용 가능

Development:
  - 로컬 개발용 변수 설정
  - .env.local 파일 사용 권장
```

## 보안 체크리스트

- [ ] `NEXT_PUBLIC_` 접두사는 공개 가능한 값만 사용
- [ ] 서버 전용 변수는 절대 클라이언트 코드에서 사용하지 않음
- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] Vercel 환경 변수에서 서버 전용 변수는 Encrypted로 설정
- [ ] 공개 저장소에 비밀 키가 커밋되지 않음

## 문제 해결

### 환경 변수가 undefined로 표시됨

1. 변수명 확인 (대소문자 구분)
2. `.env.local` 파일 확인
3. Vercel 환경 변수 설정 확인
4. 서버 재시작 (`npm run dev`)

### 클라이언트에서 서버 전용 변수 접근 시도

- 에러 메시지 확인
- `NEXT_PUBLIC_` 접두사 추가 여부 확인
- 서버 사이드 코드로 이동

## 참고 자료

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
