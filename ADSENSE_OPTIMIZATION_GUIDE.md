# 애드센스 최적화 가이드

## 개요

프롬프티아의 수익화를 위한 애드센스 최적화 및 SEO 개선 가이드입니다.

## 주요 기능

### 1. CLS 방지 광고 슬롯 (AdSlot)

레이아웃 시프트(CLS)를 방지하기 위해 고정 높이를 가진 광고 슬롯 컴포넌트를 구현했습니다.

**특징:**
- 최소 높이 미리 할당
- 광고 로드 전 플레이스홀더 표시
- 광고 로드 후 자동 높이 조정
- MutationObserver를 사용한 로드 감지

### 2. 콘텐츠 보강 (TechnicalMetadata)

작품 상세 페이지 하단에 AI 생성 정보를 표시하여 정보성 콘텐츠로서의 가치를 높입니다.

**표시 정보:**
- 사용된 AI 모델
- 프롬프트 (사용된 프롬프트 텍스트)
- 생성 의도
- 세계관 설명
- 시드 값 (재현 가능성)
- 스텝 수 (이미지 생성)
- CFG 스케일 (이미지 생성)

### 3. 동적 메타데이터 고도화

`generateMetadata` 함수를 고도화하여 구글 검색과 SNS 공유 시 완벽한 노출을 보장합니다.

**포함 내용:**
- 완전한 OpenGraph 메타데이터
- Twitter Card 메타데이터
- 키워드 최적화
- Canonical URL
- 구조화된 데이터 (JSON-LD)

### 4. 자동 사이트맵 생성

`next-sitemap`을 사용하여 빌드 시 자동으로 `sitemap.xml`과 `robots.txt`가 생성됩니다.

## 설정 방법

### 1. 환경 변수 설정

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXX
```

### 2. AdSlot 컴포넌트 사용

```typescript
import { AdSlot, BannerAdSlot, RectangleAdSlot } from "@/components/AdSlot";

// 기본 사용
<AdSlot
  adSlot="광고슬롯ID"
  adFormat="auto"
  minHeight={250}
/>

// 배너 광고
<BannerAdSlot adSlot="배너광고슬롯ID" />

// 사각형 광고
<RectangleAdSlot adSlot="사각형광고슬롯ID" />
```

### 3. TechnicalMetadata 컴포넌트 사용

```typescript
import { TechnicalMetadata } from "@/components/TechnicalMetadata";

<TechnicalMetadata
  aiModel="GPT-4"
  promptUsed="프롬프트 텍스트"
  creationIntent="창작 의도"
  worldviewDescription="세계관 설명"
  seed={12345}
  steps={50}
  cfgScale={7.5}
  createdAt="2024-01-01T00:00:00Z"
  author="작가명"
/>
```

### 4. 사이트맵 자동 생성

`next-sitemap`이 설치되어 있으면 빌드 시 자동으로 생성됩니다:

```bash
npm run build
# postbuild 스크립트가 자동으로 next-sitemap 실행
```

## 광고 배치 전략

### 권장 광고 위치

1. **상단 배너** (minHeight: 100px)
   - 페이지 로드 직후 노출
   - 높은 노출률

2. **뷰어 하단** (minHeight: 250px)
   - 콘텐츠 읽기 후 노출
   - 높은 클릭률

3. **댓글창 위** (minHeight: 90px)
   - 사용자 참여 전 노출
   - 중간 클릭률

4. **최하단** (minHeight: 100px)
   - 페이지 종료 전 노출
   - 낮은 클릭률이지만 노출 확보

### CLS 최적화

- 모든 광고 슬롯에 `minHeight` 설정
- 광고 로드 전까지 플레이스홀더 표시
- MutationObserver로 로드 완료 감지

## SEO 최적화

### 메타데이터 구조

```typescript
{
  title: "작품 제목 - 에피소드 제목 | 프롬프티아",
  description: "작품 설명...",
  keywords: ["AI 소설", "AI 웹툰", ...],
  openGraph: {
    title: "...",
    description: "...",
    url: "...",
    images: [...],
    type: "article",
    publishedTime: "...",
    authors: [...],
    section: "...",
    tags: [...],
  },
  twitter: {
    card: "summary_large_image",
    title: "...",
    description: "...",
    images: [...],
    creator: "@promptia",
    site: "@promptia",
  },
  alternates: {
    canonical: "...",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
}
```

### 콘텐츠 보강 전략

1. **기술적 메타데이터 표시**
   - AI 모델 정보
   - 프롬프트 텍스트
   - 생성 파라미터

2. **정보성 콘텐츠 추가**
   - 세계관 설명
   - 생성 의도
   - 작가 정보

3. **법적 고지**
   - AI 생성 콘텐츠 명시
   - 투명성 확보

## 애드센스 승인 확률 향상

### 1. 콘텐츠 품질

- 충분한 텍스트 콘텐츠 (최소 500자)
- 고유한 콘텐츠 (중복 없음)
- 정기적인 업데이트

### 2. 정보성 페이지

- 기술적 메타데이터로 정보성 콘텐츠 확보
- AI 생성 과정 투명성
- 교육적 가치 제공

### 3. 사용자 경험

- CLS 최소화 (0.1 이하 목표)
- 빠른 로딩 속도
- 모바일 최적화

### 4. 법적 준수

- 이용약관 및 개인정보처리방침
- AI 생성 콘텐츠 명시
- 저작권 고지

## 사이트맵 설정

### next-sitemap 설정

`next-sitemap.config.js` 파일에서 설정:

```javascript
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  generateRobotsTxt: true,
  exclude: ["/admin/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
  },
};
```

### 동적 사이트맵

`app/sitemap.ts`에서 동적 페이지 생성:

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 데이터베이스에서 작품 목록 가져오기
  const novels = await fetchNovels();
  
  return [
    // 정적 페이지
    { url: siteUrl, ... },
    // 동적 페이지
    ...novels.map(novel => ({
      url: `${siteUrl}/novels/${novel.id}`,
      lastModified: novel.updated_at,
    })),
  ];
}
```

## 성능 모니터링

### Core Web Vitals

- **CLS (Cumulative Layout Shift)**: 0.1 이하 목표
- **LCP (Largest Contentful Paint)**: 2.5초 이하 목표
- **FID (First Input Delay)**: 100ms 이하 목표

### 광고 성능

- 광고 로드 시간 모니터링
- 클릭률(CTR) 추적
- 수익 최적화

## 문제 해결

### 광고가 표시되지 않음

1. AdSense 계정 확인
2. 광고 슬롯 ID 확인
3. 환경 변수 확인 (`NEXT_PUBLIC_ADSENSE_CLIENT_ID`)
4. 브라우저 콘솔에서 오류 확인

### CLS 점수가 높음

1. 모든 광고 슬롯에 `minHeight` 설정 확인
2. 플레이스홀더 표시 확인
3. 이미지 최적화 확인

### 사이트맵이 생성되지 않음

1. `next-sitemap` 설치 확인
2. `package.json`의 `postbuild` 스크립트 확인
3. 빌드 로그 확인

## 참고 자료

- [Google AdSense 정책](https://support.google.com/adsense/answer/48182)
- [Core Web Vitals](https://web.dev/vitals/)
- [next-sitemap 문서](https://github.com/iamvishnusankar/next-sitemap)
- [OpenGraph 프로토콜](https://ogp.me/)
