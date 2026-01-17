"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";

interface RankingItem {
  id: string;
  title: string;
  description: string | null;
  type: "novel" | "webtoon" | "video";
  thumbnail_url: string | null;
  view_count: number;
  vote_count: number;
  popularity_score: number;
  created_at: string;
}

interface HomeContentProps {
  top3Rankings: RankingItem[];
  novelRankings: RankingItem[];
  webtoonRankings: RankingItem[];
  videoRankings: RankingItem[];
}

// 더미 카드 데이터 생성 함수
function createDummyCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `dummy-${i}`,
    title: "준비 중인 작품입니다",
    description: "곧 공개됩니다",
    type: "novel" as const,
    thumbnail_url: "https://via.placeholder.com/300x400/1a1a1a/666666?text=준비중",
    view_count: 0,
    vote_count: 0,
    popularity_score: 0,
    created_at: new Date().toISOString(),
  }));
}

export function HomeContent({
  top3Rankings,
  novelRankings,
  webtoonRankings,
  videoRankings,
}: HomeContentProps) {
  // 데이터가 없으면 더미 카드 5개 생성
  const displayNovels = novelRankings.length > 0 ? novelRankings : createDummyCards(5);
  const displayWebtoons = webtoonRankings.length > 0 ? webtoonRankings : createDummyCards(5);
  const displayVideos = videoRankings.length > 0 ? videoRankings : createDummyCards(5);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white drop-shadow-2xl">
                지금 가장 핫한<br />AI 소설
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 drop-shadow-lg">
                프롬프트로 만든 창의적인 작품을 만나보세요
              </p>
              <Link
                href="/upload"
                className="inline-block px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded transition-colors shadow-2xl"
              >
                투표하기
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* TOP 3 랭킹 섹션 */}
      {top3Rankings.length > 0 && (
        <section className="px-4 py-12 md:px-8 bg-black">
          <h2 className="text-3xl font-bold mb-6 text-white">실시간 랭킹 TOP 3</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3Rankings.map((item, index) => (
              <Link
                key={item.id}
                href={`/view/${item.id}`}
                className="group relative overflow-hidden rounded-lg bg-gray-900 hover:scale-105 transition-transform duration-300"
              >
                <div className="aspect-[2/3] relative">
                  <img
                    src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-0 left-0 bg-red-600 text-white px-3 py-1 text-sm font-bold">
                    {index + 1}위
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <h3 className="text-lg font-bold mb-1 line-clamp-2 text-white">{item.title}</h3>
                    <p className="text-sm text-gray-300 line-clamp-1">
                      {item.description || "설명 없음"}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>조회 {item.view_count.toLocaleString()}</span>
                      <span>추천 {item.vote_count.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 광고 배너 영역 */}
      <section className="px-4 py-8 md:px-8 bg-black">
        <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
          <p className="text-gray-400 text-sm">광고 배너 영역</p>
        </div>
      </section>

      {/* 카테고리별 작품 섹션 */}
      <section className="px-4 py-8 md:px-8 bg-black">
        <div className="space-y-12">
          {/* 소설 탭 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">소설</h2>
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
              }}
              className="!pb-12"
            >
              {displayNovels.map((item) => (
                <SwiperSlide key={item.id}>
                  {item.id.startsWith('dummy-') ? (
                    <div className="group block cursor-default">
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2 border border-gray-800">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
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
                    <Link
                      href={`/view/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
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
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 광고 배너 영역 */}
          <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
            <p className="text-gray-400 text-sm">광고 배너 영역</p>
          </div>

          {/* 웹툰 탭 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">웹툰</h2>
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
              }}
              className="!pb-12"
            >
              {displayWebtoons.map((item) => (
                <SwiperSlide key={item.id}>
                  {item.id.startsWith('dummy-') ? (
                    <div className="group block cursor-default">
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2 border border-gray-800">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
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
                    <Link
                      href={`/view/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
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
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* 광고 배너 영역 */}
          <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
            <p className="text-gray-400 text-sm">광고 배너 영역</p>
          </div>

          {/* 영상 탭 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">영상</h2>
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
              }}
              className="!pb-12"
            >
              {displayVideos.map((item) => (
                <SwiperSlide key={item.id}>
                  {item.id.startsWith('dummy-') ? (
                    <div className="group block cursor-default">
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2 border border-gray-800">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
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
                    <Link
                      href={`/view/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-900 mb-2">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
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
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    </main>
  );
}
