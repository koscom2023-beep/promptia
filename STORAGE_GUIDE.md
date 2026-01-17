# Cloudflare R2 보안 업로드 가이드

## 개요

이 가이드에서는 Cloudflare R2를 사용한 보안 업로드 파이프라인과 최적화 설정에 대해 설명합니다.

## 주요 기능

### 1. 보안 업로드 (Presigned URL)

서버에서 R2 버킷에 직접 접근하지 않고, 클라이언트에 5분 유효한 Presigned URL을 발급하여 직접 업로드합니다.

**장점:**
- 서버 부하 감소
- 보안 강화 (서버에 파일이 거치지 않음)
- 확장성 향상

### 2. 파일 검증

업로드 전에 서버 사이드에서 다음을 검증합니다:
- 파일 확장자: `webp`, `jpg`, `jpeg`, `png`만 허용
- 파일 크기: 최대 5MB
- MIME 타입: 허용된 이미지 타입만 허용

### 3. 캐싱 설정

업로드된 파일에 다음 캐시 헤더가 자동으로 설정됩니다:
```
Cache-Control: public, max-age=31536000, immutable
```

이 설정으로:
- 브라우저에서 1년간 캐시
- `immutable` 플래그로 재검증 없이 캐시 사용
- CDN 효율성 향상

## 사용 방법

### Server Action 사용 (권장)

```typescript
import { generatePresignedUploadUrl, validateUploadFile, uploadFileToR2 } from "@/app/actions/storage";

// 1. 파일 검증
const validation = await validateUploadFile({
  name: file.name,
  size: file.size,
  type: file.type,
});

if (!validation.valid) {
  console.error(validation.error);
  return;
}

// 2. Presigned URL 발급
const { presignedUrl, publicUrl, key } = await generatePresignedUploadUrl(
  file.name,
  "images", // 폴더 경로
  file.type // MIME 타입 (선택사항)
);

// 3. 클라이언트에서 직접 업로드 (클라이언트 컴포넌트에서)
"use client";
import { uploadFileToR2Secure } from "@/lib/r2-upload-client";

// 또는 수동으로:
const response = await fetch(presignedUrl, {
  method: "PUT",
  body: file,
  headers: {
    "Content-Type": file.type,
  },
});
```

### 헬퍼 함수 사용

```typescript
import { uploadFileToR2Secure } from "@/lib/r2-upload";

// 간단한 업로드
const result = await uploadFileToR2Secure(file, "images");

if (result.success) {
  console.log("업로드 성공:", result.url);
} else {
  console.error("업로드 실패:", result.error);
}
```

### 여러 파일 업로드 (클라이언트 컴포넌트)

```typescript
"use client";

import { uploadMultipleFilesToR2 } from "@/lib/r2-upload-client";

const files = [file1, file2, file3];
const results = await uploadMultipleFilesToR2(files, "images");

results.forEach((result) => {
  if (result.success) {
    console.log(`${result.filename}: ${result.url}`);
  } else {
    console.error(`${result.filename}: ${result.error}`);
  }
});
```

## 이미지 로더 사용

### Next.js Image 컴포넌트

```typescript
import Image from "next/image";
import { r2ImageLoader } from "@/lib/image-loader";

<Image
  src={r2ImageUrl}
  alt="이미지"
  width={800}
  height={600}
  loader={r2ImageLoader}
  unoptimized={true} // R2 URL은 unoptimized로 설정
/>
```

### 커스텀 이미지 컴포넌트

```typescript
import { R2Image } from "@/components/ui/r2-image";

<R2Image
  src={r2ImageUrl}
  alt="이미지"
  width={800}
  height={600}
/>
```

## 환경 변수

다음 환경 변수가 필요합니다:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=promptia-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

## 파일 제한사항

- **허용된 확장자**: `webp`, `jpg`, `jpeg`, `png`
- **최대 파일 크기**: 5MB
- **허용된 MIME 타입**: 
  - `image/webp`
  - `image/jpeg`
  - `image/jpg`
  - `image/png`

## 보안 고려사항

1. **Presigned URL 만료 시간**: 기본 5분 (300초)
2. **서버 사이드 검증**: 모든 파일은 서버에서 검증됩니다
3. **환경 변수 보안**: R2 자격 증명은 절대 클라이언트에 노출하지 마세요

## 성능 최적화

1. **캐싱**: 1년간 브라우저 캐시 (`max-age=31536000, immutable`)
2. **CDN**: Cloudflare R2 Public URL 사용
3. **직접 업로드**: 서버를 거치지 않고 클라이언트에서 직접 업로드

## 문제 해결

### 업로드 실패

1. 파일 크기 확인 (5MB 이하)
2. 파일 형식 확인 (webp, jpg, jpeg, png만 허용)
3. R2 환경 변수 확인
4. CORS 설정 확인 (브라우저에서 직접 업로드하는 경우)

### 이미지가 표시되지 않음

1. R2 Public Bucket 설정 확인
2. `R2_PUBLIC_URL` 환경 변수 확인
3. 파일 경로 확인

## 참고 자료

- [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK 문서](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)
