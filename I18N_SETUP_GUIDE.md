# 다국어(i18n) 및 법규 준수 시스템 가이드

## 개요

프롬프티아의 글로벌 확장을 위한 다국어 시스템과 한국 AI 기본법 준수를 위한 법적 고지 시스템입니다.

## 주요 기능

### 1. 다국어 지원 (i18n)

- **지원 언어**: 한국어(ko), 영어(en)
- **next-intl** 사용
- 브라우저 언어 자동 감지
- URL 기반 언어 전환 (`/ko`, `/en`)

### 2. AI 생성물 고지 배너

- 한국어 사용자에게만 표시
- 하단 고정 배너
- 부드러운 애니메이션
- X 버튼으로 닫기 가능
- localStorage에 상태 저장

### 3. SEO 최적화

- 각 언어별 alternate 링크 태그
- 언어별 메타데이터
- hreflang 태그 지원

## 파일 구조

```
app/
  [locale]/
    layout.tsx          # 다국어 레이아웃
    (marketing)/
    (platform)/
    (admin)/
    (auth)/

messages/
  ko.json              # 한국어 메시지
  en.json              # 영어 메시지

components/
  LegalDisclaimerBanner.tsx  # AI 고지 배너
  LanguageSwitcher.tsx       # 언어 전환 버튼

i18n.ts                # i18n 설정
middleware.ts          # 언어 감지 및 리다이렉트
```

## 설정 방법

### 1. 패키지 설치

```bash
npm install next-intl
```

### 2. next.config.js 설정

```javascript
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // ... 기존 설정
};

module.exports = withNextIntl(nextConfig);
```

### 3. 메시지 파일 생성

`messages/ko.json`과 `messages/en.json`에 번역 메시지를 추가하세요.

### 4. 레이아웃 마이그레이션

기존 `app/layout.tsx`를 `app/[locale]/layout.tsx`로 이동하고 `NextIntlClientProvider`로 감싸세요.

## 사용 방법

### 1. 컴포넌트에서 번역 사용

```typescript
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("common");
  
  return <h1>{t("siteName")}</h1>;
}
```

### 2. 서버 컴포넌트에서 번역 사용

```typescript
import { getTranslations } from "next-intl/server";

export async function MyServerComponent() {
  const t = await getTranslations("common");
  
  return <h1>{t("siteName")}</h1>;
}
```

### 3. 언어 전환

```typescript
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

const locale = useLocale();
const router = useRouter();
const pathname = usePathname();

// 언어 전환
const switchLocale = (newLocale: string) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0] as any)) {
    segments[0] = newLocale;
  } else {
    segments.unshift(newLocale);
  }
  router.push(`/${segments.join("/")}`);
};
```

### 4. 링크 생성

```typescript
import Link from "next/link";
import { useLocale } from "next-intl";

const locale = useLocale();

<Link href={`/${locale}/upload`}>업로드</Link>
```

## AI 고지 배너

### 표시 조건

- 한국어(ko) 사용자에게만 표시
- localStorage에 `ai_disclaimer_dismissed`가 `true`가 아닌 경우

### 동작

1. 페이지 로드 후 500ms 지연 후 표시
2. 부드러운 슬라이드 업 애니메이션
3. X 버튼 클릭 시 닫기
4. 닫힌 상태는 localStorage에 저장

### 커스터마이징

`components/LegalDisclaimerBanner.tsx`에서 스타일과 메시지를 수정할 수 있습니다.

## SEO 설정

### Alternate 링크 태그

각 페이지의 메타데이터에 `alternates`를 추가하세요:

```typescript
export async function generateMetadata({ params: { locale } }) {
  return {
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        ko: `${siteUrl}/ko`,
        en: `${siteUrl}/en`,
        "x-default": `${siteUrl}/ko`,
      },
    },
  };
}
```

### hreflang 태그

Next.js가 자동으로 생성하지만, 필요시 수동으로 추가할 수 있습니다.

## 브라우저 언어 감지

미들웨어에서 `Accept-Language` 헤더를 파싱하여 자동으로 언어를 감지합니다:

1. URL에 locale이 없으면 브라우저 언어 확인
2. 지원하는 언어가 아니면 기본 언어(ko)로 리다이렉트
3. 지원하는 언어면 해당 언어로 리다이렉트

## 메시지 파일 구조

### ko.json

```json
{
  "common": {
    "siteName": "프롬프티아",
    "tagline": "AI 창작 서바이벌"
  },
  "legal": {
    "aiDisclaimer": {
      "title": "인공지능 생성물 고지",
      "message": "..."
    }
  }
}
```

### en.json

```json
{
  "common": {
    "siteName": "Promptia",
    "tagline": "AI Creation Survival"
  },
  "legal": {
    "aiDisclaimer": {
      "title": "AI Generated Content Notice",
      "message": "..."
    }
  }
}
```

## 문제 해결

### 언어가 전환되지 않음

1. `middleware.ts`의 `matcher` 설정 확인
2. 브라우저 캐시 삭제
3. `next.config.js`의 `withNextIntl` 설정 확인

### 배너가 표시되지 않음

1. `locale`이 "ko"인지 확인
2. localStorage에 `ai_disclaimer_dismissed`가 `true`가 아닌지 확인
3. 브라우저 콘솔에서 에러 확인

### 번역이 작동하지 않음

1. 메시지 파일 경로 확인 (`messages/${locale}.json`)
2. `i18n.ts` 설정 확인
3. `NextIntlClientProvider`로 감싸져 있는지 확인

## 참고 자료

- [next-intl 문서](https://next-intl-docs.vercel.app/)
- [Next.js i18n 가이드](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [한국 AI 기본법](https://www.law.go.kr/)
