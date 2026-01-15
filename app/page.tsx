import { getRanking, getTop3Ranking } from "@/app/actions/ranking";
import { JsonLd } from "@/components/JsonLd";
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

  return (
    <div className="bg-black min-h-screen text-white">
      <JsonLd data={jsonLd} />
      
      {/* 히어로 섹션 */}
      <section className="relative h-[70vh] min-h-[600px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/50" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
              지금 가장 핫한<br />AI 소설
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 drop-shadow-lg">
              프롬프트로 만든 창의적인 작품을 만나보세요
            </p>
            <Link
              href="/upload"
              className="inline-block px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded transition-colors shadow-2xl"
            >
              지금 투표하세요
            </Link>
          </div>
        </div>
      </section>

      {/* 작품 리스트 섹션 */}
      <div className="container mx-auto px-4 py-12">
        {/* 소설 섹션 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">소설</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayNovels.map((item) => (
              <div key={item.id}>
                {item.id.startsWith('dummy-') ? (
                  <div className="group cursor-default">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2 border border-gray-800">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-50"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">준비 중</p>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 text-gray-500">
                      {item.title}
                    </h3>
                  </div>
                ) : (
                  <Link href={`/view/${item.id}`} className="group block">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2">
                      <img
                        src={item.thumbnail_url || "https://via.placeholder.com/400x600/222/fff?text=Cover"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-red-600 transition-colors text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      추천 {item.vote_count.toLocaleString()}
                    </p>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 웹툰 섹션 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">웹툰</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayWebtoons.map((item) => (
              <div key={item.id}>
                {item.id.startsWith('dummy-') ? (
                  <div className="group cursor-default">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2 border border-gray-800">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-50"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">준비 중</p>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 text-gray-500">
                      {item.title}
                    </h3>
                  </div>
                ) : (
                  <Link href={`/view/${item.id}`} className="group block">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2">
                      <img
                        src={item.thumbnail_url || "https://via.placeholder.com/400x600/222/fff?text=Cover"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-red-600 transition-colors text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      추천 {item.vote_count.toLocaleString()}
                    </p>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 영상 섹션 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-white">영상</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayVideos.map((item) => (
              <div key={item.id}>
                {item.id.startsWith('dummy-') ? (
                  <div className="group cursor-default">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2 border border-gray-800">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-50"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">준비 중</p>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 text-gray-500">
                      {item.title}
                    </h3>
                  </div>
                ) : (
                  <Link href={`/view/${item.id}`} className="group block">
                    <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2">
                      <img
                        src={item.thumbnail_url || "https://via.placeholder.com/400x600/222/fff?text=Cover"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-red-600 transition-colors text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      추천 {item.vote_count.toLocaleString()}
                    </p>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
