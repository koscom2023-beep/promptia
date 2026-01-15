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

export function HomeContent({
  top3Rankings,
  novelRankings,
  webtoonRankings,
  videoRankings,
}: HomeContentProps) {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* TOP 3 랭킹 섹션 */}
      {top3Rankings.length > 0 && (
        <section className="px-4 py-8 md:px-8">
          <h2 className="text-3xl font-bold mb-6">실시간 랭킹 TOP 3</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3Rankings.map((item, index) => (
              <Link
                key={item.id}
                href={`/view/${item.id}`}
                className="group relative overflow-hidden rounded-lg bg-gray-800 hover:scale-105 transition-transform duration-300"
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
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-lg font-bold mb-1 line-clamp-2">{item.title}</h3>
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
      <section className="px-4 py-8 md:px-8">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm">광고 배너 영역</p>
        </div>
      </section>

      {/* 카테고리별 작품 섹션 */}
      <section className="px-4 py-8 md:px-8">
        <div className="space-y-12">
          {/* 소설 탭 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">소설</h2>
            {novelRankings.length > 0 ? (
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
                {novelRankings.map((item) => (
                  <SwiperSlide key={item.id}>
                    <Link
                      href={`/view/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-800 mb-2">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        추천 {item.vote_count.toLocaleString()}
                      </p>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <p className="text-gray-500">아직 소설이 없습니다.</p>
            )}
          </div>

          {/* 광고 배너 영역 */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">광고 배너 영역</p>
          </div>

          {/* 웹툰 탭 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">웹툰</h2>
            {webtoonRankings.length > 0 ? (
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
                {webtoonRankings.map((item) => (
                  <SwiperSlide key={item.id}>
                    <Link
                      href={`/view/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-800 mb-2">
                        <img
                          src={item.thumbnail_url || "https://via.placeholder.com/300x400"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        추천 {item.vote_count.toLocaleString()}
                      </p>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <p className="text-gray-500">아직 웹툰이 없습니다.</p>
            )}
          </div>

          {/* 광고 배너 영역 */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">광고 배너 영역</p>
          </div>

          {/* 영상 탭 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">영상</h2>
            {videoRankings.length > 0 ? (
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
                {videoRankings.map((item) => (
                  <SwiperSlide key={item.id}>
                    <Link
                      href={`/view/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-gray-800 mb-2">
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
                      <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-red-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        추천 {item.vote_count.toLocaleString()}
                      </p>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <p className="text-gray-500">아직 영상이 없습니다.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
