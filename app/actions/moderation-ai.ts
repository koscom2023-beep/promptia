"use server";

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * OpenAI Moderation API를 사용한 콘텐츠 검수
 * 
 * @param content - 검수할 텍스트 콘텐츠
 * @returns 검수 결과 (flagged, categories, scores)
 */
export async function moderateContent(content: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY가 설정되지 않았습니다. 검수를 건너뜁니다.");
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
      };
    }

    // OpenAI Moderation API 호출
    const moderation = await openai.moderations.create({
      model: "text-moderation-latest",
      input: content,
    });

    const result = moderation.results[0];

    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
    };
  } catch (error) {
    console.error("AI 검수 API 호출 오류:", error);
    // API 오류 시 안전하게 통과시킴 (서비스 중단 방지)
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      error: error instanceof Error ? error.message : "검수 API 오류",
    };
  }
}

/**
 * 작품 자동 검수 (제목 + 설명)
 * 
 * @param novelId - 작품 ID
 * @returns 검수 결과 및 처리 상태
 */
export async function moderateNovel(novelId: string) {
  try {
    const supabase = await createClient();

    // 작품 정보 가져오기
    const { data: novel, error: fetchError } = await supabase
      .from("novels")
      .select("id, title, description, type")
      .eq("id", novelId)
      .single();

    if (fetchError || !novel) {
      return {
        success: false,
        error: "작품을 찾을 수 없습니다.",
      };
    }

    // 제목과 설명을 합쳐서 검수
    const contentToModerate = `${novel.title}\n${novel.description || ""}`;

    // OpenAI Moderation 실행
    const moderationResult = await moderateContent(contentToModerate);

    // 유해 콘텐츠 발견 시 처리
    if (moderationResult.flagged) {
      // is_blocked를 true로 변경 (차단)
      const { error: updateError } = await supabase
        .from("novels")
        .update({
          is_blocked: true, // 차단
          // moderation_result: moderationResult as any, // 나중에 컬럼 추가 시 사용
          // moderated_at: new Date().toISOString(),
        })
        .eq("id", novelId);

      if (updateError) {
        console.error("작품 상태 업데이트 오류:", updateError);
        return {
          success: false,
          error: "작품 상태 업데이트에 실패했습니다.",
        };
      }

      // 관리자 검수 큐에 자동 추가 (reports 테이블 활용)
      await supabase.from("reports").insert({
        novel_id: novelId,
        reason: "ai_moderation",
        details: `AI 자동 검수 결과 유해 콘텐츠 감지: ${Object.keys(moderationResult.categories)
          .filter((key) => moderationResult.categories[key as keyof typeof moderationResult.categories])
          .join(", ")}`,
        status: "pending",
        reported_at: new Date().toISOString(),
      });

      return {
        success: true,
        flagged: true,
        message: "유해 콘텐츠가 감지되어 관리자 검수 대기 중입니다.",
        categories: moderationResult.categories,
      };
    }

    // 안전한 콘텐츠
    const { error: updateError } = await supabase
      .from("novels")
      .update({
        is_blocked: false,
        // moderation_result: moderationResult as any, // 나중에 컬럼 추가 시 사용
        // moderated_at: new Date().toISOString(),
      })
      .eq("id", novelId);

    if (updateError) {
      console.error("작품 상태 업데이트 오류:", updateError);
    }

    return {
      success: true,
      flagged: false,
      message: "검수 통과: 안전한 콘텐츠입니다.",
    };
  } catch (error) {
    console.error("작품 검수 중 오류:", error);
    return {
      success: false,
      error: "작품 검수 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 에피소드 자동 검수
 * 
 * @param episodeId - 에피소드 ID
 * @returns 검수 결과
 */
export async function moderateEpisode(episodeId: string) {
  try {
    const supabase = await createClient();

    // 에피소드 정보 가져오기
    const { data: episode, error: fetchError } = await supabase
      .from("episodes")
      .select("id, title, content, novel_id")
      .eq("id", episodeId)
      .single();

    if (fetchError || !episode) {
      return {
        success: false,
        error: "에피소드를 찾을 수 없습니다.",
      };
    }

    // 제목과 내용을 합쳐서 검수
    const contentToModerate = `${episode.title}\n${episode.content || ""}`;

    // OpenAI Moderation 실행
    const moderationResult = await moderateContent(contentToModerate);

    // 유해 콘텐츠 발견 시 처리
    if (moderationResult.flagged) {
      // 해당 작품을 차단
      await supabase
        .from("novels")
        .update({
          is_blocked: true,
        })
        .eq("id", episode.novel_id);

      // 검수 큐에 추가
      await supabase.from("reports").insert({
        novel_id: episode.novel_id,
        reason: "ai_moderation",
        details: `에피소드 "${episode.title}" AI 검수 결과 유해 콘텐츠 감지`,
        status: "pending",
      });

      return {
        success: true,
        flagged: true,
        message: "유해 콘텐츠가 감지되어 관리자 검수 대기 중입니다.",
      };
    }

    return {
      success: true,
      flagged: false,
      message: "검수 통과",
    };
  } catch (error) {
    console.error("에피소드 검수 중 오류:", error);
    return {
      success: false,
      error: "에피소드 검수 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 댓글 자동 검수
 * 
 * @param commentContent - 댓글 내용
 * @returns 검수 결과 (통과/차단)
 */
export async function moderateComment(commentContent: string): Promise<boolean> {
  try {
    const moderationResult = await moderateContent(commentContent);
    
    // 유해 콘텐츠면 false 반환 (댓글 작성 거부)
    return !moderationResult.flagged;
  } catch (error) {
    console.error("댓글 검수 중 오류:", error);
    // 에러 시 안전하게 통과
    return true;
  }
}
