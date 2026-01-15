import { getRanking, getTop3Ranking } from "@/app/actions/ranking";
import { JsonLd } from "@/components/JsonLd";
import { StickyHeader } from "@/components/sticky-header";
import { HeroSection } from "@/components/hero-section";
import { RankingSection } from "@/components/ranking-section";
import { HorizontalSection } from "@/components/horizontal-section";
import type { Metadata } from "next";
import Link from "next/link";

// 동적 렌더링 설정 (Supabase cookies 사용으로 인해 필요)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "프롬프티아 (Promptia)",
  description: "독자와 AI 창작자들의 해방구 - 프롬프티아에서 AI로 만든 웹소설과 웹툰을 만나보세요",
  openGraph: {
    title: "프롬프티아 (Promptia)",
    description: "독자와 AI 창작자들의 해방구",
    type: "website",
  },
};

// 더미 카드 데이터 생성
function createDummyCards(count: number, type: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: `dummy-${type}-${i}`,
    title: "준비 중인 작품입니다",
    thumbnail_url: `https://via.placeholder.com/400x600/222/fff?text=Cover+${i + 1}`,
    vote_count: 0,
  }));
}

export default async function Home() {
  // 초기 데이터 가져오기
  const [top3Rankings, novelRankings, webtoonRankings, videoRankings] = await Promise.all([
    getTop3Ranking(),
    getRanking("novel"),
    getRanking("webtoon"),
    getRanking("video"),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  
  // 데이터가 없으면 더미 카드 5개 생성
  const displayNovels = novelRankings.length > 0 ? novelRankings : createDummyCards(5, "novel");
  const displayWebtoons = webtoonRankings.length > 0 ? webtoonRankings : createDummyCards(5, "webtoon");
  const displayVideos = videoRankings.length > 0 ? videoRankings : createDummyCards(5, "video");
  
  // 메인 페이지 JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "프롬프티아",
    description: "독자와 AI 창작자들의 해방구",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Hero 섹션용 데이터 (TOP 3 중 첫 번째 또는 더미)
  const heroData = top3Rankings.length > 0 ? {
    title: top3Rankings[0].title,
    author: "작가명",
    genres: [top3Rankings[0].type === "novel" ? "소설" : top3Rankings[0].type === "webtoon" ? "웹툰" : "영상"],
    description: top3Rankings[0].description || "AI로 만든 창의적인 작품을 만나보세요",
    imageUrl: top3Rankings[0].thumbnail_url || "https://via.placeholder.com/400x600/222/fff?text=Cover",
    id: top3Rankings[0].id,
  } : {
    title: "지금 가장 핫한 AI 창작물",
    author: "프롬프티아",
    genres: ["소설", "웹툰", "영상"],
    description: "AI로 만든 창의적인 작품을 만나보세요. 당신의 프롬프트가 작품이 되는 곳입니다.",
    imageUrl: "https://via.placeholder.com/400x600/222/fff?text=Cover",
  };

  // 랭킹 섹션용 데이터 변환
  const rankingItems = top3Rankings.map((item, index) => ({
    id: item.id,
    rank: index + 1,
    title: item.title,
    views: item.view_count,
    likes: item.vote_count,
    imageUrl: item.thumbnail_url || "https://via.placeholder.com/400x600/222/fff?text=Cover",
    type: item.type,
  }));

  // Horizontal 섹션용 데이터 변환
  const convertToHorizontalItems = (items: typeof novelRankings) => {
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.thumbnail_url || "https://via.placeholder.com/400x600/222/fff?text=Cover",
      badge: item.vote_count > 100 ? "UP" as const : undefined,
    }));
  };

  const novelItems = convertToHorizontalItems(displayNovels);
  const webtoonItems = convertToHorizontalItems(displayWebtoons);
  const videoItems = convertToHorizontalItems(displayVideos);

  return (
    <main className="min-h-screen bg-[#161b26]">
      <JsonLd data={jsonLd} />
      <StickyHeader />

      <HeroSection {...heroData} />

      <div className="space-y-0">
        {rankingItems.length > 0 && (
          <RankingSection title="실시간 인기작" items={rankingItems} />
        )}

        {novelItems.length > 0 && (
          <HorizontalSection title="인기 소설" items={novelItems} />
        )}

        {webtoonItems.length > 0 && (
          <HorizontalSection title="인기 웹툰" items={webtoonItems} />
        )}

        {videoItems.length > 0 && (
          <HorizontalSection title="인기 영상" items={videoItems} />
        )}
      </div>
    </main>
  );
}
