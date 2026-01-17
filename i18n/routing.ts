import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // 1. 지원하는 언어 목록
  locales: ['en', 'ko'],
  // 2. 기본 언어 설정
  defaultLocale: 'ko',
  // 3. 주소창에 항상 /ko 또는 /en이 붙도록 설정
  localePrefix: 'always'
});

// 컴포넌트에서 사용할 Link, useRouter 등을 내보냅니다.
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);