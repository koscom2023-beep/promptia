"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "ai_disclaimer_dismissed";

export function LegalDisclaimerBanner() {
  const t = useTranslations("legal.aiDisclaimer");
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 한국어 사용자에게만 표시
    if (locale !== "ko") {
      return;
    }

    // localStorage에서 닫힘 상태 확인
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    // 약간의 지연 후 애니메이션으로 표시
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [locale]);

  const handleDismiss = () => {
    setIsVisible(false);
    // 애니메이션 완료 후 상태 업데이트
    setTimeout(() => {
      setIsDismissed(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }, 300);
  };

  // 한국어가 아니거나 이미 닫힌 경우 렌더링하지 않음
  if (locale !== "ko" || isDismissed) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-600/95 to-orange-600/95 backdrop-blur-sm border-t border-yellow-500/50 shadow-lg transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
      role="banner"
      aria-label={t("title")}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">
              {t("title")}
            </h3>
            <p className="text-xs text-white/90 leading-relaxed">
              {t("message")}
            </p>
            <Link
              href={`/${locale}/legal/terms`}
              className="text-xs text-white underline hover:text-yellow-200 mt-1 inline-block"
            >
              {t("learnMore")}
            </Link>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-white hover:text-yellow-200 transition-colors rounded-full hover:bg-white/10"
            aria-label={t("close")}
            title={t("close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
