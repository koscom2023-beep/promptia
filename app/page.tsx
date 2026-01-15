import { getRanking, getTop3Ranking } from "@/app/actions/ranking";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import { HomeContent } from "@/components/HomeContent";

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

export default async function Home() {
  // 초기 데이터 가져오기
  const [top3Rankings, novelRankings, webtoonRankings, videoRankings] = await Promise.all([
    getTop3Ranking(),
    getRanking("novel"),
    getRanking("webtoon"),
    getRanking("video"),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  
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

  return (
    <>
      <JsonLd data={jsonLd} />
      <HomeContent
        top3Rankings={top3Rankings}
        novelRankings={novelRankings}
        webtoonRankings={webtoonRankings}
        videoRankings={videoRankings}
      />
    </>
  );
}
