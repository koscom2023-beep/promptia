# Cloudflare R2 연동 가이드

## 개요

Vercel 과금 방지를 위해 Cloudflare R2를 사용한 하이브리드 스토리지 시스템을 구현했습니다.

### 주요 기능

1. **R2 이미지 업로드**: S3 호환 API를 사용한 이미지 업로드
2. **Presigned URL**: 임시 접근 URL 생성
3. **CDN 직접 사용**: Vercel 서버를 거치지 않고 R2 CDN 직접 사용
4. **비용 절감**: 이미지 최적화를 Vercel 서버가 아닌 R2에서 처리

## 설치

### 1단계: 패키지 설치

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2단계: Cloudflare R2 설정

1. Cloudflare 대시보드 → R2로 이동
2. 새 버킷 생성 (예: `promptia-images`)
3. 버킷 설정 → Public Access 활성화 (선택사항, CDN URL 사용 시)
4. API 토큰 생성:
   - R2 → Manage R2 API Tokens
   - Create API Token
   - 권한: Object Read & Write
   - 토큰 정보 저장

### 3단계: 환경 변수 설정

`.env.local` 파일에 다음 변수 추가:

```env
# Cloudflare R2 설정
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=promptia-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # Public Bucket CDN URL (선택사항)
```

**참고**: 
- `R2_ACCOUNT_ID`: Cloudflare 대시보드 우측 하단에서 확인
- `R2_PUBLIC_URL`: Public Bucket을 설정한 경우 CDN URL (예: `https://pub-xxxxx.r2.dev`)
- Public Bucket을 사용하지 않으면 Presigned URL 사용

### 4단계: Vercel 환경 변수 설정

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서 위 변수들을 추가하세요.

## 사용 방법

### 이미지 업로드

#### 서버 액션 사용

```typescript
import { uploadToR2 } from "@/lib/r2"

// 파일 업로드
const file = new File([...], "image.jpg", { type: "image/jpeg" })
const url = await uploadToR2(file, "images/my-image.jpg", "image/jpeg")
```

#### API 라우트 사용

```typescript
const formData = new FormData()
formData.append("file", file)
formData.append("folder", "webtoons") // 선택사항

const response = await fetch("/api/upload/r2", {
  method: "POST",
  body: formData,
})

const { url, key } = await response.json()
```

### 이미지 표시

#### WebtoonViewer 컴포넌트 (자동 최적화)

```typescript
import { WebtoonViewer } from "@/components/WebtoonViewer"

// R2 URL이면 자동으로 CDN 사용, 아니면 원본 URL 사용
<WebtoonViewer imageUrls={imageUrls} />
```

#### R2Image 컴포넌트 사용

```typescript
import { R2Image } from "@/components/ui/r2-image"

<R2Image
  src={imageUrl}
  alt="이미지 설명"
  className="w-full h-auto"
  width={800}
  height={600}
/>
```

#### 일반 img 태그 (수동)

```typescript
import { getOptimizedImageUrl } from "@/lib/image-loader"

<img
  src={getOptimizedImageUrl(imageUrl)}
  alt="이미지"
  className="w-full"
/>
```

## 파일 구조

```
lib/
  ├── r2.ts              # R2 업로드 및 Presigned URL 생성
  ├── image-loader.ts    # 이미지 로더 유틸리티
  └── utils.ts           # 기존 유틸리티

components/
  ├── WebtoonViewer.tsx  # R2 최적화 적용
  └── ui/
      └── r2-image.tsx   # R2 최적화 이미지 컴포넌트

app/
  └── api/
      └── upload/
          └── r2/
              └── route.ts  # R2 업로드 API
```

## 비용 절감 효과

### Vercel 이미지 최적화 비용
- **무료**: 1,000회/월
- **과금**: $5/100,000회

### R2 비용
- **저장**: $0.015/GB/월
- **읽기**: 무료 (Class A 요청)
- **쓰기**: $4.50/1M 요청 (Class B)

### 예상 절감
- 이미지 10,000개 (평균 500KB) = 5GB
- 월 저장 비용: $0.075
- 읽기 요청: 무료
- **Vercel 대비 약 99% 비용 절감**

## 주의사항

1. **Public Bucket 설정**: CDN URL을 사용하려면 Public Bucket을 설정해야 합니다.
2. **CORS 설정**: 브라우저에서 직접 업로드하려면 R2 버킷에 CORS 설정이 필요합니다.
3. **환경 변수 보안**: R2 자격 증명은 절대 클라이언트에 노출하지 마세요.
4. **Presigned URL 만료**: 기본 만료 시간은 1시간입니다. 필요시 조정하세요.

## CORS 설정 (선택사항)

브라우저에서 직접 업로드하려면 R2 버킷에 CORS 설정:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 문제 해결

### 업로드 실패
- 환경 변수가 올바르게 설정되었는지 확인
- R2 API 토큰 권한 확인
- 버킷 이름 확인

### 이미지가 표시되지 않음
- Public Bucket이 설정되어 있는지 확인
- CDN URL이 올바른지 확인
- Presigned URL 만료 시간 확인

### Vercel 서버를 거치는 경우
- `next.config.js`의 `unoptimized: true` 확인
- `R2Image` 컴포넌트 또는 `getOptimizedImageUrl` 사용 확인
