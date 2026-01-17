import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// locales와 Locale 타입을 export (컴포넌트에서 사용)
export const locales = routing.locales;
export type Locale = (typeof locales)[number];
export const defaultLocale = routing.defaultLocale;

export default getRequestConfig(async ({ locale }) => {
  // 지원하지 않는 언어일 경우 기본 언어(ko)를 사용
  const validLocale = (routing.locales.includes(locale as any) ? locale : routing.defaultLocale) as string;

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});