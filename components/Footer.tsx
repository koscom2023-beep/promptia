"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");
  
  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-400 mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* 링크 섹션 */}
        <div className="flex flex-wrap gap-6 mb-6">
          <Link
            href={`/${locale}/legal/terms`}
            className="hover:text-white transition-colors"
          >
            {t("termsOfService")}
          </Link>
          <Link
            href={`/${locale}/legal/privacy`}
            className="hover:text-white transition-colors"
          >
            {t("privacyPolicy")}
          </Link>
          <Link
            href={`/${locale}/blog`}
            className="hover:text-white transition-colors"
          >
            {t("customerService")}
          </Link>
        </div>

        {/* 법적 고지 */}
        <div className="mb-6 text-sm leading-relaxed">
          <p className="mb-2">
            {t("disclaimer")}
          </p>
        </div>

        {/* 카피라이트 */}
        <div className="text-xs italic text-gray-500">
          © 2026 {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
