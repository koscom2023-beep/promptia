"use server";

import { createClient } from "./server";
import OpenAI from "openai";

/**
 * AI 검색 인프라
 * 보고서 6장: pgvector를 활용한 벡터 유사도 검색
 * 
 * 기능:
 * - 작품 설명으로부터 임베딩 생성 (OpenAI)
 * - pgvector를 활용한 벡터 유사도 검색
 * - 검색 결과 반환
 */

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 텍스트로부터 임베딩 벡터 생성
 * OpenAI text-embedding-ada-002 모델 사용 (1536차원)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!text || text.trim().length === 0) {
      return null;
    }

    const openaiInstance = await getOpenAI();
    if (!openaiInstance) {
      console.error("OpenAI API Key가 설정되지 않았습니다.");
      return null;
    }

    const response = await openaiInstance.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.trim(),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("임베딩 생성 실패:", error);
    return null;
  }
}

/**
 * 작품의 설명으로부터 임베딩을 생성하고 데이터베이스에 저장
 */
export async function updateWorkEmbedding(workId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // 작품 정보 가져오기
    const { data: work, error: fetchError } = await supabase
      .from("novels")
      .select("id, title, description")
      .eq("id", workId)
      .single();

    if (fetchError || !work) {
      console.error("작품 조회 실패:", fetchError);
      return false;
    }

    // 설명이 없으면 제목만 사용
    const textToEmbed = work.description || work.title || "";

    if (!textToEmbed) {
      console.warn("임베딩할 텍스트가 없습니다.");
      return false;
    }

    // 임베딩 생성
    const embedding = await generateEmbedding(textToEmbed);

    if (!embedding) {
      console.error("임베딩 생성 실패");
      return false;
    }

    // 데이터베이스에 임베딩 저장
    // 참고: Supabase는 vector 타입을 배열로 받습니다
    const { error: updateError } = await supabase
      .from("novels")
      .update({
        embedding: `[${embedding.join(",")}]`, // PostgreSQL vector 형식으로 변환
      })
      .eq("id", workId);

    if (updateError) {
      console.error("임베딩 저장 실패:", updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("작품 임베딩 업데이트 실패:", error);
    return false;
  }
}

/**
 * 검색 쿼리로부터 유사한 작품 검색
 * pgvector의 cosine similarity 사용
 * 
 * @param query - 검색 쿼리 텍스트
 * @param limit - 반환할 결과 개수 (기본값: 10)
 * @param similarityThreshold - 유사도 임계값 (0-1, 기본값: 0.7)
 * @param type - 작품 타입 필터 (선택사항)
 */
export async function searchSimilarWorks(
  query: string,
  limit: number = 10,
  similarityThreshold: number = 0.7,
  type?: "novel" | "webtoon" | "video"
) {
  try {
    const supabase = await createClient();

    // 검색 쿼리로부터 임베딩 생성
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
      return {
        success: false,
        error: "임베딩 생성 실패",
        results: [],
      };
    }

    // pgvector를 사용한 유사도 검색
    // Supabase RPC 함수 사용 (migration.sql에 정의된 search_similar_works 함수)
    const { data, error } = await supabase.rpc("search_similar_works", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      similarity_threshold: similarityThreshold,
      result_limit: limit,
    });

    if (error) {
      console.error("벡터 검색 실패:", error);
      
      // RPC 함수가 없으면 직접 쿼리 (폴백)
      return await searchSimilarWorksFallback(
        queryEmbedding,
        limit,
        similarityThreshold,
        type
      );
    }

    // 타입 필터링 (필요한 경우)
    let filteredResults = data || [];
    if (type) {
      filteredResults = filteredResults.filter((item: any) => item.type === type);
    }

    return {
      success: true,
      results: filteredResults,
      query,
      embeddingGenerated: true,
    };
  } catch (error) {
    console.error("작품 검색 실패:", error);
    return {
      success: false,
      error: "검색 중 오류가 발생했습니다.",
      results: [],
    };
  }
}

/**
 * RPC 함수가 없을 때 사용하는 폴백 검색 함수
 * 직접 SQL 쿼리로 유사도 계산
 */
async function searchSimilarWorksFallback(
  queryEmbedding: number[],
  limit: number,
  similarityThreshold: number,
  type?: "novel" | "webtoon" | "video"
) {
  try {
    const supabase = await createClient();

    // 모든 작품 가져오기 (임베딩이 있는 것만)
    let query = supabase
      .from("novels")
      .select("id, title, description, type, thumbnail_url, view_count, vote_count, embedding")
      .not("embedding", "is", null)
      .eq("is_blocked", false)
      .eq("status", "approved");

    if (type) {
      query = query.eq("type", type);
    }

    const { data: works, error } = await query;

    if (error || !works) {
      return {
        success: false,
        error: "작품 조회 실패",
        results: [],
      };
    }

    // JavaScript에서 cosine similarity 계산
    const results = works
      .map((work: any) => {
        if (!work.embedding) return null;

        // embedding이 문자열인 경우 파싱
        let embedding: number[];
        if (typeof work.embedding === "string") {
          embedding = JSON.parse(work.embedding);
        } else {
          embedding = work.embedding;
        }

        // Cosine similarity 계산
        const similarity = cosineSimilarity(queryEmbedding, embedding);

        return {
          id: work.id,
          title: work.title,
          description: work.description,
          type: work.type,
          thumbnail_url: work.thumbnail_url,
          view_count: work.view_count,
          vote_count: work.vote_count,
          similarity,
        };
      })
      .filter((item: any) => item !== null && item.similarity >= similarityThreshold)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);

    return {
      success: true,
      results,
      embeddingGenerated: true,
    };
  } catch (error) {
    console.error("폴백 검색 실패:", error);
    return {
      success: false,
      error: "검색 중 오류가 발생했습니다.",
      results: [],
    };
  }
}

/**
 * Cosine similarity 계산 함수
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * 배치로 여러 작품의 임베딩 업데이트
 */
export async function batchUpdateEmbeddings(workIds: string[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const workId of workIds) {
    try {
      const success = await updateWorkEmbedding(workId);
      if (success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(workId);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(workId);
    }
  }

  return results;
}
