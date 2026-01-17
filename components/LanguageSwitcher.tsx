"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/i18n/request";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: Locale) => {
    // 현재 경로에서 locale 부분을 새 locale로 교체
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    const newPath = `/${segments.join("/")}`;
    router.push(newPath);
  };

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors rounded hover:bg-gray-900"
        aria-label={t("language")}
        title={t("language")}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">{locale.toUpperCase()}</span>
      </button>
      
      {/* 드롭다운 메뉴 */}
      <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[120px] z-50">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => switchLocale(loc)}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              locale === loc
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {loc === "ko" ? t("korean") : t("english")}
          </button>
        ))}
      </div>
    </div>
  );
}
