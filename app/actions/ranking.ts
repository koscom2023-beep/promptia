"use server";

import { createClient } from "@/lib/supabase/server";

interface NovelRanking {
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

export async function getRanking(category?: "novel" | "webtoon") {
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
        category,
        cover_image_url,
        view_count,
        created_at,
        votes(id)
      `
      );

    // 카테고리 필터링
    if (category) {
      query = query.eq("category", category);
    }

    // hidden=false만 조회
    query = query.eq("hidden", false);

    const { data: novels, error } = await query;

    if (error) {
      console.error("랭킹 조회 오류:", error);
      return [];
    }

    // popularity_score 계산 및 정렬
    const rankings: NovelRanking[] = (novels || []).map((novel: any) => {
      const voteCount = Array.isArray(novel.votes) ? novel.votes.length : 0;
      const viewCount = novel.view_count || 0;
      const popularityScore = viewCount * 1 + voteCount * 10;

      return {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        category: novel.category,
        cover_image_url: novel.cover_image_url,
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
