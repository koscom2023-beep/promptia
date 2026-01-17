import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Script from 'next/script';

// 1. 필요한 디자인과 컴포넌트들을 불러옵니다.
import "../globals.css"; 
import { Header } from "@/components/Header"; // 로그인 버튼이 들어있는 메뉴바
import { Footer } from "@/components/Footer"; 
import { AuthProvider } from "@/contexts/AuthContext"; // 로그인 상태를 관리하는 기능

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        {/* Google AdSense 스크립트 - lazyOnload로 최적화 */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-0000000000000000'}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="bg-[#161b26] text-white antialiased flex flex-col min-h-screen">
        {/* 2. AuthProvider로 감싸야 로그인 기능이 작동합니다. */}
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            {/* 3. Header를 넣어야 상단 로그인 버튼이 보입니다. */}
            <Header /> 
            
            <main className="flex-1">
              {children}
            </main>

            <Footer />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}