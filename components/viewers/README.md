# 하이브리드 콘텐츠 뷰어 시스템

보고서 2.3절의 사양에 맞춰 구현된 카테고리별 뷰어 컴포넌트입니다.

## 구조

모든 뷰어는 **서버 컴포넌트(RSC)에서 데이터를 받고 클라이언트에서 인터랙션을 처리**하도록 설계되었습니다.

```
components/viewers/
├── NovelViewer.tsx      # 소설 뷰어
├── WebtoonViewer.tsx    # 웹툰 뷰어
├── VideoViewer.tsx      # 영상 뷰어
├── ImageSkeleton.tsx    # 이미지 로딩 스켈레톤
└── README.md            # 이 파일
```

## NovelViewer (소설 뷰어)

### 기능

- **폰트 크기 조절**: 작게, 보통, 크게, 아주 크게 (4단계)
- **폰트 선택**: 본고딕, 나눔고딕, 나눔명조, 프리텐다드
- **줄간격 조절**: 좁게, 보통, 넓게 (3단계)
- **스크롤 위치 저장**: sessionStorage를 사용하여 읽던 위치 복원
- **설정 저장**: localStorage를 사용하여 사용자 설정 저장

### 사용법

```tsx
import { NovelViewer } from "@/components/viewers/NovelViewer";

<NovelViewer
  content={episode.content}
  episodeId={episodeId}
  novelId={novelId}
/>
```

### Props

- `content: string` - 소설 본문 내용
- `episodeId: string` - 에피소드 ID (스크롤 위치 저장용)
- `novelId: string` - 작품 ID (설정 저장용)

### 특징

- **가독성 높은 텍스트 레이아웃**: 
  - 최대 너비 4xl (896px)
  - 양쪽 정렬 (justify)
  - 단어 단위 줄바꿈 (word-break: keep-all)
  - 적절한 줄간격 (1.5 ~ 2.2)

- **반응형 설정 패널**:
  - 고정 위치 (sticky)
  - 슬라이드 애니메이션
  - 다크 모드 스타일

## WebtoonViewer (웹툰 뷰어)

### 기능

- **세로 무한 스크롤**: 모든 이미지를 세로로 나열
- **이미지 Lazy Loading**: Intersection Observer를 사용한 지연 로딩
- **여백 없는 이미지 나열**: 전체 너비 사용, 이미지 간 여백 없음
- **최적화된 이미지 로딩**: R2 CDN을 통한 이미지 최적화

### 사용법

```tsx
import { WebtoonViewer } from "@/components/viewers/WebtoonViewer";

<WebtoonViewer
  imageUrls={episode.image_urls}
/>
```

### Props

- `imageUrls: string[]` - 웹툰 이미지 URL 배열

### 특징

- **Intersection Observer 기반 Lazy Loading**:
  - 뷰포트 200px 전에 미리 로드
  - 초기 5개 이미지는 즉시 로드
  - 로드된 이미지만 실제 렌더링

- **성능 최적화**:
  - R2 이미지 로더 사용
  - unoptimized 모드 (Vercel 서버 우회)
  - 우선순위 로딩 (처음 3개)

- **스켈레톤 UI**:
  - 로딩 중 플레이스홀더 표시
  - 최소 높이 600px 유지 (CLS 방지)

## VideoViewer (영상 뷰어)

### 기능

- **Facade 패턴**: 썸네일을 먼저 보여주고, 클릭 시 YouTube 임베드 로드
- **YouTube URL 자동 파싱**: 다양한 YouTube URL 형식 지원
- **자동 재생**: 썸네일 클릭 시 자동 재생
- **로딩 상태 표시**: iframe 로드 중 인디케이터

### 사용법

```tsx
import { VideoViewer } from "@/components/viewers/VideoViewer";

<VideoViewer
  youtubeUrl={episode.content}
  thumbnailUrl={novel.thumbnail_url}
  title={episode.title}
/>
```

### Props

- `youtubeUrl: string` - YouTube 비디오 URL
- `thumbnailUrl?: string` - 커스텀 썸네일 URL (선택사항)
- `title?: string` - 비디오 제목 (선택사항)

### 특징

- **Facade 패턴 구현**:
  - 초기에는 썸네일만 표시 (빠른 로딩)
  - 클릭 시 YouTube iframe 로드 (초기 성능 최적화)
  - 로딩 중 스피너 표시

- **YouTube URL 지원**:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`

- **자동 썸네일 생성**:
  - 커스텀 썸네일이 없으면 YouTube 썸네일 자동 생성
  - maxresdefault 품질 사용

## ImageSkeleton (이미지 스켈레톤)

웹툰 뷰어에서 사용하는 로딩 플레이스홀더입니다.

### 특징

- 그라데이션 배경
- 로딩 스피너 애니메이션
- 최소 높이 유지 (CLS 방지)

## 통합 예시

에피소드 페이지에서 사용하는 예시:

```tsx
// app/(platform)/novels/[id]/[episodeId]/page.tsx

{novel.type === "novel" ? (
  <NovelViewer 
    content={episode.content || ""} 
    episodeId={params.episodeId}
    novelId={novel.id}
  />
) : novel.type === "webtoon" ? (
  <WebtoonViewer
    imageUrls={
      Array.isArray(episode.image_urls)
        ? episode.image_urls
        : []
    }
  />
) : novel.type === "video" ? (
  <VideoViewer
    youtubeUrl={episode.content || ""}
    thumbnailUrl={novel.thumbnail_url || undefined}
    title={episode.title}
  />
) : null}
```

## 성능 최적화

### NovelViewer

- localStorage/sessionStorage 사용 (서버 부하 없음)
- 디바운스된 스크롤 이벤트 핸들러
- CSS 기반 폰트 크기 조절 (리플로우 최소화)

### WebtoonViewer

- Intersection Observer로 필요한 이미지만 로드
- R2 CDN 사용 (Vercel 서버 우회)
- 우선순위 로딩 (처음 3개 이미지)

### VideoViewer

- Facade 패턴으로 초기 로딩 최소화
- 썸네일만 먼저 표시 (YouTube API 호출 지연)
- 클릭 시에만 iframe 로드

## 접근성

- 모든 버튼에 `aria-label` 추가
- 키보드 네비게이션 지원
- 스크린 리더 호환

## 브라우저 호환성

- Intersection Observer: 모던 브라우저 지원
- localStorage/sessionStorage: 모든 브라우저 지원
- CSS Grid/Flexbox: 모던 브라우저 지원

## 향후 개선 사항

- [ ] NovelViewer: 다크 모드/라이트 모드 전환
- [ ] WebtoonViewer: 이미지 줌 기능
- [ ] VideoViewer: 재생 속도 조절
- [ ] 모든 뷰어: 오프라인 지원 (Service Worker)
