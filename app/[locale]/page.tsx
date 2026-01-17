/**
 * Locale 홈 페이지
 * 
 * (marketing) 그룹의 페이지 내용을 그대로 사용합니다.
 */

import { getTop3Ranking } from "@/app/actions/ranking";
import { JsonLd } from "@/components/JsonLd";
import { HeroSection } from "@/components/hero-section";
import { RankingList } from "@/components/RankingList";
import { FeedAd } from "@/components/ads/AdSlot";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

// 동적 렌더링 설정 (Supabase cookies 사용으로 인해 필요)
export const dynamic = 'force-dynamic';

/**
 * Generate metadata for the locale home page.
 * @param {{ params: { locale: string } }} props - Route parameters containing `locale`.
 * @returns {Promise<Metadata>} Metadata object for Next.js.
 */
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  
  const title = locale === "ko" 
    ? `${t("siteName")} - AI 창작 플랫폼`
    : `${t("siteName")} - AI Creation Platform`;
  
  const description = locale === "ko"
    ? "독자와 AI 창작자들의 해방구 - 프롬프티아에서 AI로 만든 웹소설, 웹툰, 영상을 만나보세요. 실시간 랭킹과 투표로 최고의 AI 창작물을 발견하세요."
    : "A sanctuary for readers and AI creators - Discover AI-generated web novels, webtoons, and videos on Promptia. Find the best AI creations through real-time rankings and voting.";

  const keywords = locale === "ko"
    ? ["프롬프티아", "AI 소설", "AI 웹툰", "AI 창작", "웹소설", "공모전", "투표", "랭킹", "프롬프트"]
    : ["Promptia", "AI novel", "AI webtoon", "AI creation", "web novel", "contest", "voting", "ranking", "prompt"];

  return {
    title,
    description,
    keywords,
    authors: [{ name: "Promptia" }],
    creator: "Promptia",
    publisher: "Promptia",
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'ko': `${siteUrl}/ko`,
        'en': `${siteUrl}/en`,
        'x-default': `${siteUrl}/ko`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}`,
      siteName: locale === "ko" ? "프롬프티아" : "Promptia",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "website",
      images: [
        {
          url: `${siteUrl}/api/og?title=${encodeURIComponent(t("siteName"))}&type=novel`,
          width: 1200,
          height: 630,
          alt: t("siteName"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@promptia",
      site: "@promptia",
      images: [`${siteUrl}/api/og?title=${encodeURIComponent(t("siteName"))}&type=novel`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

/**
 * Locale-specific home page component.
 * @param {{ params: { locale: string } }} props - Route parameters containing `locale`.
 * @returns {Promise<JSX.Element>} The rendered home page.
 */
export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // TOP 3 랭킹 데이터 가져오기 (히어로 섹션용)
  let top3Ranking: Array<any> = [];
  try {
    top3Ranking = await getTop3Ranking();
  } catch (err) {
    console.error("Failed to fetch top3 ranking:", err);
    top3Ranking = [];
  }

  // 히어로 섹션 데이터 (상위 1위 작품)
  const heroData = top3Ranking[0]
    ? {
        id: top3Ranking[0].id,
        title: top3Ranking[0].title,
        imageUrl:
          top3Ranking[0].thumbnail_url ||
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop&q=80",
        description: top3Ranking[0].description || "",
      }
    : {
        id: "dummy-hero",
        title: "프롬프티아에 오신 것을 환영합니다",
        imageUrl:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop&q=80",
        description: "AI로 만든 창작물을 만나보세요",
      };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: t("siteName"),
          url: siteUrl,
          description:
            locale === "ko"
              ? "AI 소설, 웹툰, 영상 공모전 및 투표 플랫폼"
              : "AI novel, webtoon, and video contest and voting platform",
        }}
      />

      <HeroSection
        id={heroData.id}
        title={heroData.title}
        imageUrl={heroData.imageUrl}
        description={heroData.description}
      />

      {/* 광고 #1 - 히어로 섹션 하단 */}
      <div className="container mx-auto px-4">
        <FeedAd slotId="1234567890" />
      </div>
        
      {/* 실시간 랭킹 리스트 (Suspense와 스트리밍 적용) */}
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <RankingList />
      </Suspense>

      {/* 광고 #2 - 랭킹 리스트 하단 */}
      <div className="container mx-auto px-4 mb-12">
        <FeedAd slotId="0987654321" />
      </div>
    </>
  );
}
