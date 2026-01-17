"use server";

import { createClient } from "@/lib/supabase/server";

interface NovelRanking {
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

/**
 * 실시간 중력 기반 랭킹 점수 계산 함수
 * 보고서 5장의 공식 적용
 * 공식: (투표수 * 10) + (조회수 * 1) + (최신성 보정값)
 * 
 * 최신성 보정값: 최근 생성된 작품에 가산점 부여
 * - 24시간 이내: +100
 * - 7일 이내: +50
 * - 30일 이내: +20
 * - 그 외: 0
 */
function calculateGravityScore(
  viewCount: number,
  voteCount: number,
  createdAt: string
): number {
  const V = viewCount || 0; // 조회수
  const P = voteCount || 0; // 투표수
  
  // 기본 점수 계산
  const baseScore = (P * 10) + (V * 1);
  
  // 최신성 보정값 계산
  const now = new Date();
  const created = new Date(createdAt);
  const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  const daysElapsed = hoursElapsed / 24;
  
  let recencyBonus = 0;
  if (daysElapsed <= 1) {
    // 24시간 이내: +100
    recencyBonus = 100;
  } else if (daysElapsed <= 7) {
    // 7일 이내: +50
    recencyBonus = 50;
  } else if (daysElapsed <= 30) {
    // 30일 이내: +20
    recencyBonus = 20;
  }
  // 그 외: 0 (보정값 없음)
  
  // 최종 점수 = 기본 점수 + 최신성 보정값
  const finalScore = baseScore + recencyBonus;
  
  return Math.max(0, finalScore); // 음수 방지
}

/**
 * Materialized View에서 랭킹 조회 (최적화된 방법)
 * View가 없으면 직접 계산
 */
export async function getRanking(type?: "novel" | "webtoon" | "video") {
  try {
    const supabase = await createClient();

    // Materialized View가 설정되지 않았으므로 직접 계산 방식 사용
    // 모든 작품 조회 (is_blocked 컬럼이 DB에 없으므로 제거)
    let novelsQuery = supabase
      .from("novels")
      .select(
        `
        id,
        title,
        description,
        type,
        thumbnail_url,
        view_count,
        vote_count,
        created_at
      `
      );

    if (type) {
      novelsQuery = novelsQuery.eq("type", type);
    }

    const { data: novels, error: novelsError } = await novelsQuery;

    if (novelsError || !novels) {
      console.error("랭킹 조회 오류:", novelsError);
      return [];
    }

    // 중력 기반 점수 계산 및 정렬
    const calculatedRankings: NovelRanking[] = (novels || []).map((novel: any) => {
      const viewCount = novel.view_count || 0;
      const voteCount = novel.vote_count || 0;
      const gravityScore = calculateGravityScore(
        viewCount,
        voteCount,
        novel.created_at
      );

      return {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        type: novel.type || 'novel',
        thumbnail_url: novel.thumbnail_url,
        view_count: viewCount,
        vote_count: voteCount,
        popularity_score: gravityScore,
        created_at: novel.created_at,
      };
    });

    // 중력 점수로 정렬 (내림차순)
    calculatedRankings.sort((a, b) => b.popularity_score - a.popularity_score);

    // TOP 10만 반환
    return calculatedRankings.slice(0, 10);
  } catch (error) {
    console.error("랭킹 조회 중 오류:", error);
    return [];
  }
}

/**
 * TOP 3 랭킹 가져오기 (중력 기반)
 */
export async function getTop3Ranking() {
  try {
    const supabase = await createClient();

    // Materialized View가 설정되지 않았으므로 직접 계산 방식 사용
    // 모든 작품 조회
    const { data: novels, error: novelsError } = await supabase
      .from("novels")
      .select(
        `
        id,
        title,
        description,
        type,
        thumbnail_url,
        view_count,
        vote_count,
        created_at
      `
      );

    if (novelsError || !novels) {
      console.error("TOP 3 랭킹 조회 오류:", novelsError);
      return [];
    }

    // 중력 기반 점수 계산 및 정렬
    const calculatedRankings: NovelRanking[] = (novels || []).map((novel: any) => {
      const viewCount = novel.view_count || 0;
      const voteCount = novel.vote_count || 0;
      const gravityScore = calculateGravityScore(
        viewCount,
        voteCount,
        novel.created_at
      );

      return {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        type: novel.type || 'novel',
        thumbnail_url: novel.thumbnail_url,
        view_count: viewCount,
        vote_count: voteCount,
        popularity_score: gravityScore,
        created_at: novel.created_at,
      };
    });

    // 중력 점수로 정렬 (내림차순)
    calculatedRankings.sort((a, b) => b.popularity_score - a.popularity_score);

    // TOP 3만 반환
    return calculatedRankings.slice(0, 3);
  } catch (error) {
    console.error("TOP 3 랭킹 조회 중 오류:", error);
    return [];
  }
}

/**
 * Materialized View 수동 갱신 함수 (서버 액션)
 * 필요시 호출하여 랭킹을 즉시 갱신할 수 있습니다.
 */
export async function refreshRanking() {
  try {
    const supabase = await createClient();
    
    // Supabase에서는 RPC를 통해 함수 호출
    const { error } = await supabase.rpc("refresh_realtime_ranking");
    
    if (error) {
      console.error("랭킹 갱신 오류:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("랭킹 갱신 중 오류:", error);
    return { success: false, error: "랭킹 갱신 중 오류가 발생했습니다." };
  }
}
