"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  const { user, loading } = useAuth();
  const supabase = createClient();
  const t = useTranslations("header");
  const locale = useLocale();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-2xl font-bold text-white hover:text-red-600 transition-colors">
          {t("siteName")}
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link
            href={`/${locale}/blog`}
            className="px-3 py-2 text-gray-300 hover:text-white transition-colors rounded hover:bg-gray-900"
          >
            {t("guide")}
          </Link>
          <Link
            href={`/${locale}/upload`}
            className="px-3 py-2 text-gray-300 hover:text-white transition-colors rounded hover:bg-gray-900"
          >
            {t("upload")}
          </Link>
          
          <LanguageSwitcher />
          
          {loading ? (
            <div className="w-20 h-8 bg-gray-800 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
            >
              {t("login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
