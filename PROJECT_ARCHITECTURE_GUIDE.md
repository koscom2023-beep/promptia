# 프로젝트 기본 아키텍처 및 디자인 시스템 가이드

## 개요

프롬프티아(Promptia) 프로젝트의 기본 아키텍처와 넷플릭스 스타일 디자인 시스템 설정 가이드입니다.

## 기술 스택

- **Next.js 14**: App Router 사용
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **Lucide React**: 아이콘 라이브러리
- **next-themes**: 다크 모드 테마 관리
- **next-intl**: 다국어 지원

## 디자인 시스템

### 넷플릭스 스타일 다크 모드

**색상 팔레트:**

```typescript
netflix: {
  black: "#000000",        // 기본 배경
  dark: "#0f172a",         // slate-900 (보조 배경)
  "dark-secondary": "#1e293b", // slate-800
  "dark-tertiary": "#334155",  // slate-700
  red: "#e50914",         // 넷플릭스 레드
  "red-hover": "#f40612",  // 호버 상태
}
```

**사용 예시:**

```tsx
<div className="bg-netflix-black text-foreground">
  <button className="bg-netflix-red hover:bg-netflix-red-hover">
    버튼
  </button>
</div>
```

### 전역 폰트

**Noto Sans KR** 사용:
- 가중치: 400, 500, 700, 900
- display: swap (FOUT 방지)
- CSS 변수: `--font-noto-sans-kr`

**사용:**

```tsx
// 자동으로 적용됨 (body에 className으로 설정)
<div className="font-sans">텍스트</div>
```

## 레이아웃 구조

### app/[locale]/layout.tsx

루트 레이아웃 구조:

```
<html>
  <body>
    <ThemeProvider>        // next-themes
      <NextIntlClientProvider>  // next-intl
        <AuthProvider>      // 인증 컨텍스트
          {children}
          <LegalDisclaimerBanner />
        </AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  </body>
</html>
```

### Route Groups

```
app/
  [locale]/
    (marketing)/    # 마케팅 페이지 (홈, 블로그, 법적 페이지)
    (platform)/     # 플랫폼 페이지 (작품 보기, 업로드)
    (admin)/        # 관리자 페이지
    (auth)/         # 인증 페이지
```

## 컴포넌트 구조

### 메인 페이지 구성

1. **히어로 섹션** (`HeroSection`)
   - 대형 배너 이미지
   - 그라데이션 오버레이
   - CTA 버튼

2. **랭킹 섹션** (`RankingSection`)
   - 실시간 TOP 10 랭킹
   - 가로 스크롤 카드

3. **작품 리스트** (`HorizontalSection`)
   - 탭 메뉴 (소설/웹툰/영상)
   - 그리드 레이아웃
   - 가로 스크롤

### 컴포넌트 예시

```tsx
// 히어로 섹션
<HeroSection
  id={heroData.id}
  title={heroData.title}
  imageUrl={heroData.imageUrl}
  description={heroData.description}
/>

// 랭킹 섹션
<RankingSection
  title="실시간 TOP 10 랭킹"
  items={rankingItems}
/>

// 작품 리스트 (탭 메뉴 포함)
<HorizontalSection
  title="AI 추천 소설"
  items={novelItems}
/>
```

## Tailwind 설정

### tailwind.config.ts

```typescript
{
  darkMode: "class",  // next-themes를 위한 클래스 기반
  theme: {
    extend: {
      colors: {
        netflix: { /* 넷플릭스 색상 */ },
        background: { /* 배경 색상 */ },
        foreground: { /* 텍스트 색상 */ },
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-kr)", "system-ui", "sans-serif"],
      },
    },
  },
}
```

## next-themes 설정

### ThemeProvider

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  disableTransitionOnChange={false}
>
  {children}
</ThemeProvider>
```

**설정 옵션:**
- `attribute="class"`: 클래스 기반 테마 전환
- `defaultTheme="dark"`: 기본 다크 모드
- `enableSystem={false}`: 시스템 설정 무시 (항상 다크 모드)
- `disableTransitionOnChange={false}`: 테마 전환 시 트랜지션 유지

## CSS 유틸리티

### 커스텀 유틸리티

```css
/* 넷플릭스 그라데이션 */
.netflix-gradient {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

/* 텍스트 그림자 */
.text-shadow-netflix {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* 스크롤바 숨기기 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

## 사용 예시

### 다크 모드 배경

```tsx
<div className="bg-netflix-black">
  {/* 완전 검은 배경 */}
</div>

<div className="bg-netflix-dark">
  {/* 어두운 배경 (#0f172a) */}
</div>
```

### 텍스트 색상

```tsx
<p className="text-foreground">기본 텍스트</p>
<p className="text-foreground-secondary">보조 텍스트</p>
<p className="text-foreground-muted">약한 텍스트</p>
```

### 넷플릭스 스타일 버튼

```tsx
<button className="bg-netflix-red hover:bg-netflix-red-hover text-white px-6 py-3 rounded font-semibold transition-colors">
  시청하기
</button>
```

## 파일 구조

```
app/
  [locale]/
    layout.tsx              # 루트 레이아웃
    (marketing)/
      layout.tsx            # 마케팅 레이아웃
      page.tsx              # 홈 페이지
components/
  ThemeProvider.tsx         # next-themes 프로바이더
  hero-section.tsx          # 히어로 섹션
  ranking-section.tsx       # 랭킹 섹션
  horizontal-section.tsx   # 작품 리스트
tailwind.config.ts         # Tailwind 설정
app/globals.css            # 전역 스타일
```

## 참고 자료

- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [Lucide React](https://lucide.dev/)
