import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// next-intl 미들웨어 생성
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. 다국어 미들웨어 먼저 실행
  const response = intlMiddleware(request);

  // 2. 관리자 경로 접근 제어
  const pathname = request.nextUrl.pathname;
  
  // /dashboard 또는 /admin으로 시작하는 경로 체크
  if (pathname.includes('/dashboard') || pathname.includes('/admin')) {
    try {
      // Supabase 클라이언트 생성
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
            },
          },
        }
      );

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/ko/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 사용자 role 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // role이 admin 또는 moderator가 아니면 접근 차단
      if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
        // 403 Forbidden 페이지로 리다이렉트
        return NextResponse.redirect(new URL('/ko', request.url));
      }
    } catch (error) {
      console.error('관리자 권한 확인 오류:', error);
      return NextResponse.redirect(new URL('/ko/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/', 
    '/(ko|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};