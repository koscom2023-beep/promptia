# 배포 및 DevOps 가이드

## 개요

프롬프티아의 배포 환경 설정 및 DevOps 최적화 가이드입니다.

## 주요 기능

### 1. 중력 기반 랭킹 알고리즘

보고서 4.1절의 공식을 적용한 Materialized View와 자동 갱신 시스템입니다.

**공식:**
```
Score = ((V × 1) + (L × 5) + (P × 10) - 1) / (T + 2)^1.8
```

- V: view_count (조회수, 가중치 1)
- L: 좋아요 (현재는 vote_count로 대체, 가중치 5)
- P: vote_count (투표수, 가중치 10)
- T: 경과 시간 (시간 단위, 지수 1.8)

### 2. 환경 변수 분리

클라이언트 노출이 필요한 키만 `NEXT_PUBLIC_` 접두사를 사용하고, 서비스 롤 키는 서버에서만 사용됩니다.

### 3. 빌드 체크

타입 체크와 린트를 빌드 전에 실행하여 타입 에러 시 배포가 중단됩니다.

### 4. DB 타입 동기화

Supabase 스키마 변경 시 타입 정의를 자동으로 동기화합니다.

## 설정 방법

### 1. 중력 알고리즘 설정

Supabase SQL Editor에서 `create_ranking_system_final.sql` 파일을 실행하세요:

```sql
-- Materialized View 생성
-- pg_cron 스케줄 설정 (5분마다 자동 갱신)
```

**주의사항:**
- Supabase Pro 플랜 이상에서만 pg_cron 사용 가능
- 무료 플랜에서는 Supabase Edge Functions나 외부 cron 서비스 사용 권장

### 2. 환경 변수 설정

#### 로컬 개발 (.env.local)

```env
# 클라이언트 노출 (NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXX
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# 서버 전용 (NEXT_PUBLIC_ 없음)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=promptia-images
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=your-project-id
```

#### Vercel 환경 변수

1. Vercel Dashboard → Project → Settings → Environment Variables
2. 모든 환경 변수 추가
3. 서버 전용 변수는 "Encrypted" 체크

### 3. 빌드 체크 설정

`package.json`에 다음 스크립트가 포함되어 있습니다:

```json
{
  "scripts": {
    "build": "npm run type-check && npm run lint && next build",
    "type-check": "tsc --noEmit",
    "lint": "next lint"
  }
}
```

**빌드 프로세스:**
1. 타입 체크 (`tsc --noEmit`)
2. 린트 체크 (`next lint`)
3. 빌드 (`next build`)
4. 사이트맵 생성 (`next-sitemap`)

### 4. DB 타입 동기화

데이터베이스 스키마가 변경되면 타입 정의를 동기화하세요:

```bash
# 방법 1: npm 스크립트 사용
SUPABASE_PROJECT_ID=your-project-id npm run sync-types

# 방법 2: Supabase CLI 직접 사용
supabase gen types typescript --project-id your-project-id --schema public > types/supabase.ts
```

**자동화:**
- `.env.local`에 `SUPABASE_PROJECT_ID` 설정
- `npm run sync-types` 실행

## 배포 프로세스

### 1. 로컬 테스트

```bash
# 타입 체크
npm run type-check

# 린트 체크
npm run lint

# 개발 서버 실행
npm run dev
```

### 2. 빌드 테스트

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
npm run start
```

### 3. Vercel 배포

```bash
# Vercel CLI 사용
vercel --prod

# 또는 GitHub 연동 시 자동 배포
git push origin main
```

### 4. 배포 후 확인

- [ ] 사이트 접속 확인
- [ ] 환경 변수 확인
- [ ] 랭킹 시스템 작동 확인
- [ ] 광고 표시 확인
- [ ] 사이트맵 생성 확인 (`/sitemap.xml`)

## 중력 알고리즘 모니터링

### 랭킹 갱신 확인

```sql
-- 최근 갱신 시간 확인
SELECT * FROM pg_stat_user_tables WHERE relname = 'realtime_ranking';

-- pg_cron 스케줄 확인
SELECT * FROM cron.job WHERE jobname = 'refresh-ranking-every-5min';

-- 수동 갱신 (필요시)
SELECT refresh_realtime_ranking();
```

### 랭킹 점수 확인

```sql
-- TOP 10 랭킹
SELECT 
  title,
  type,
  view_count,
  vote_count,
  gravity_score,
  created_at
FROM realtime_ranking
ORDER BY gravity_score DESC
LIMIT 10;

-- 카테고리별 랭킹
SELECT * FROM realtime_ranking 
WHERE type = 'novel' 
ORDER BY gravity_score DESC 
LIMIT 10;
```

## 타입 안정성

### TypeScript 설정

`tsconfig.json`에서 다음 옵션이 활성화되어 있습니다:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### 타입 에러 시 배포 중단

빌드 스크립트에 타입 체크가 포함되어 있어, 타입 에러가 있으면 배포가 중단됩니다:

```bash
npm run build
# → type-check 실행
# → 타입 에러 시 빌드 중단
```

## 환경 변수 보안

### 클라이언트 노출 변수

- `NEXT_PUBLIC_` 접두사 사용
- 공개되어도 안전한 값만 사용
- 브라우저 번들에 포함됨

### 서버 전용 변수

- `NEXT_PUBLIC_` 접두사 없음
- 절대 클라이언트 코드에서 사용하지 않음
- Vercel에서 "Encrypted"로 설정

## 문제 해결

### 빌드 실패 (타입 에러)

1. 타입 에러 확인: `npm run type-check`
2. 타입 정의 동기화: `npm run sync-types`
3. 타입 에러 수정 후 재빌드

### 빌드 실패 (린트 에러)

1. 린트 에러 확인: `npm run lint`
2. 자동 수정 시도: `npm run lint -- --fix`
3. 수동 수정 후 재빌드

### 랭킹이 갱신되지 않음

1. pg_cron 확장 활성화 확인
2. 스케줄 확인: `SELECT * FROM cron.job WHERE jobname = 'refresh-ranking-every-5min';`
3. 수동 갱신 테스트: `SELECT refresh_realtime_ranking();`

### 환경 변수 오류

1. 변수명 확인 (대소문자 구분)
2. `.env.local` 파일 확인
3. Vercel 환경 변수 설정 확인
4. 서버 재시작

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build
```

## 성능 최적화

### Materialized View

- 최근 30일 이내 작품만 대상
- 인덱스 최적화
- CONCURRENTLY 갱신으로 블로킹 방지

### 빌드 최적화

- 타입 체크 캐싱
- 린트 캐싱
- 증분 빌드

## 참고 자료

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Type Generation](https://supabase.com/docs/guides/api/generating-types)
- [PostgreSQL pg_cron](https://github.com/citusdata/pg_cron)
