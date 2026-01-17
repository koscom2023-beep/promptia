import { Suspense } from "react";
import { RankingSection } from "@/components/ranking-section";
import { HorizontalSection } from "@/components/horizontal-section";
import { getRanking, getTop3Ranking } from "@/app/actions/ranking";
import { RankingSkeleton } from "./RankingSkeleton";

/**
 * 실시간 랭킹 데이터를 가져오는 서버 컴포넌트
 */
async function RankingData({ type }: { type: "novel" | "webtoon" | "video" }) {
  const rankings = await getRanking(type);
  
  const items = rankings.map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: item.thumbnail_url || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80",
    badge: item.vote_count > 100 ? ("UP" as const) : undefined,
  }));

  const title = type === "novel" ? "AI 추천 소설" : type === "webtoon" ? "AI 추천 웹툰" : "AI 추천 영상";

  return <HorizontalSection title={title} items={items} />;
}

/**
 * TOP 3 랭킹 데이터를 가져오는 서버 컴포넌트
 */
async function Top3RankingData() {
  const top3Rankings = await getTop3Ranking();
  
  const rankingItems = top3Rankings.map((item, index) => ({
    id: item.id,
    rank: index + 1,
    title: item.title,
    author: "프롬프티아", // 실제 작가명 필드가 없으므로 임시값
    genre: item.type === "novel" ? "소설" : item.type === "webtoon" ? "웹툰" : "영상",
    views: item.view_count,
    likes: item.vote_count,
    imageUrl: item.thumbnail_url || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80",
    type: item.type,
  }));

  return <RankingSection title="실시간 TOP 10 랭킹" items={rankingItems} />;
}

/**
 * 실시간 랭킹 리스트 컴포넌트 (Suspense로 감싸서 스트리밍)
 */
export function RankingList() {
  return (
    <div className="space-y-0">
      {/* TOP 3 랭킹 */}
      <Suspense fallback={<RankingSkeleton title="실시간 TOP 10 랭킹" />}>
        <Top3RankingData />
      </Suspense>

      {/* 소설 랭킹 */}
      <Suspense fallback={<RankingSkeleton title="AI 추천 소설" />}>
        <RankingData type="novel" />
      </Suspense>

      {/* 웹툰 랭킹 */}
      <Suspense fallback={<RankingSkeleton title="AI 추천 웹툰" />}>
        <RankingData type="webtoon" />
      </Suspense>

      {/* 영상 랭킹 */}
      <Suspense fallback={<RankingSkeleton title="AI 추천 영상" />}>
        <RankingData type="video" />
      </Suspense>
    </div>
  );
}
