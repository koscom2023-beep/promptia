"use client";

interface RankingItem {
  id: string;
  title: string;
  description: string | null;
  category: "novel" | "webtoon";
  cover_image_url: string | null;
  view_count: number;
  vote_count: number;
  popularity_score: number;
  created_at: string;
}

interface RankingSectionProps {
  initialRankings: {
    novels: RankingItem[];
    webtoons: RankingItem[];
  };
}

export function RankingSection({ initialRankings }: RankingSectionProps) {
  return (
    <div className="mb-12">
      <div className="grid md:grid-cols-2 gap-8">
        {/* 소설 랭킹 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">소설 랭킹</h2>
          <div className="space-y-3">
            {initialRankings.novels.length > 0 ? (
              initialRankings.novels.map((novel, index) => (
                <a
                  key={novel.id}
                  href={`/novels/${novel.id}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400 w-8">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{novel.title}</h3>
                      <p className="text-sm text-gray-500">
                        조회 {novel.view_count} · 추천 {novel.vote_count}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-gray-500">아직 랭킹이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 웹툰 랭킹 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">웹툰 랭킹</h2>
          <div className="space-y-3">
            {initialRankings.webtoons.length > 0 ? (
              initialRankings.webtoons.map((webtoon, index) => (
                <a
                  key={webtoon.id}
                  href={`/novels/${webtoon.id}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400 w-8">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{webtoon.title}</h3>
                      <p className="text-sm text-gray-500">
                        조회 {webtoon.view_count} · 추천 {webtoon.vote_count}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-gray-500">아직 랭킹이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
