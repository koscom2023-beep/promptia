"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const { user, loading } = useAuth();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          프롬프티아
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link
            href="/blog"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            가이드
          </Link>
          <Link
            href="/upload"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            업로드
          </Link>
          
          {loading ? (
            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
