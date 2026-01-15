import { RankingSection } from "@/components/RankingSection";
import { getRanking } from "@/app/actions/ranking";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";

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
  // 초기 랭킹 데이터 가져오기
  const [novelRankings, webtoonRankings] = await Promise.all([
    getRanking("novel"),
    getRanking("webtoon"),
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
      <main className="container mx-auto px-4 py-8">
      {/* 랭킹 섹션 */}
      <RankingSection
        initialRankings={{
          novels: novelRankings,
          webtoons: webtoonRankings,
        }}
      />

      {/* 메인 콘텐츠 */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-2">프롬프티아</h1>
        <p className="text-lg text-gray-500 mb-2">독자와 AI 창작자들의 해방구</p>
        <p className="text-base text-gray-600 mb-8">
          AI로 만든 창의적인 작품을 공유하고 투표해보세요!
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/upload"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            작품 업로드하기
          </a>
        </div>
      </div>
      </main>
    </>
  );
}
