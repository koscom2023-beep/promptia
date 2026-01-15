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

export async function getRanking(type?: "novel" | "webtoon" | "video") {
  try {
    const supabase = await createClient();

    // 기본 쿼리: novels와 votes를 조인하여 vote_count 계산
    let query = supabase
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
        created_at,
        is_blocked,
        votes(id)
      `
      );

    // 타입 필터링
    if (type) {
      query = query.eq("type", type);
    }

    // 블라인드 처리된 작품 제외 (is_blocked가 false이거나 null인 것만)
    // Supabase에서는 is() 메서드를 사용
    query = query.or("is_blocked.is.null,is_blocked.eq.false");

    const { data: novels, error } = await query;

    if (error) {
      console.error("랭킹 조회 오류:", error);
      return [];
    }

    // popularity_score 계산 및 정렬
    const rankings: NovelRanking[] = (novels || []).map((novel: any) => {
      const voteCount = novel.vote_count || (Array.isArray(novel.votes) ? novel.votes.length : 0);
      const viewCount = novel.view_count || 0;
      const popularityScore = viewCount * 1 + voteCount * 10;

      return {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        type: novel.type,
        thumbnail_url: novel.thumbnail_url,
        view_count: viewCount,
        vote_count: voteCount,
        popularity_score: popularityScore,
        created_at: novel.created_at,
      };
    });

    // 인기도 점수로 정렬 (내림차순)
    rankings.sort((a, b) => b.popularity_score - a.popularity_score);

    // TOP 10만 반환
    return rankings.slice(0, 10);
  } catch (error) {
    console.error("랭킹 조회 중 오류:", error);
    return [];
  }
}

// TOP 3 랭킹 가져오기
export async function getTop3Ranking() {
  try {
    const supabase = await createClient();

    const { data: novels, error } = await supabase
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
        created_at,
        is_blocked,
        votes(id)
      `
      )
      .or("is_blocked.is.null,is_blocked.eq.false")
      .order("vote_count", { ascending: false })
      .limit(3);

    if (error) {
      console.error("TOP 3 랭킹 조회 오류:", error);
      return [];
    }

    const rankings: NovelRanking[] = (novels || []).map((novel: any) => {
      const voteCount = novel.vote_count || (Array.isArray(novel.votes) ? novel.votes.length : 0);
      const viewCount = novel.view_count || 0;
      const popularityScore = viewCount * 1 + voteCount * 10;

      return {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        type: novel.type,
        thumbnail_url: novel.thumbnail_url,
        view_count: viewCount,
        vote_count: voteCount,
        popularity_score: popularityScore,
        created_at: novel.created_at,
      };
    });

    return rankings;
  } catch (error) {
    console.error("TOP 3 랭킹 조회 중 오류:", error);
    return [];
  }
}
