// Supabase Edge Function: AI 모더레이션
// OpenAI Moderation API를 사용하여 유해 콘텐츠 감지

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ModerationRequest {
  novel_id?: string;
  episode_id?: string;
  content: string;
  title?: string;
}

interface ModerationResponse {
  flagged: boolean;
  categories?: Record<string, boolean>;
  category_scores?: Record<string, number>;
  error?: string;
}

/**
 * OpenAI Moderation API 호출
 */
async function checkModeration(content: string): Promise<ModerationResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: content,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API 오류: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const result = data.results[0];

    return {
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
    };
  } catch (error) {
    console.error("Moderation API 호출 실패:", error);
    throw error;
  }
}

/**
 * 작품 상태 업데이트
 */
async function updateNovelStatus(
  supabase: any,
  novelId: string,
  status: "pending" | "approved" | "rejected",
  reason?: string
) {
  const { error } = await supabase
    .from("novels")
    .update({
      is_blocked: status === "rejected",
      // status 필드가 있다면 추가
      // status: status,
    })
    .eq("id", novelId);

  if (error) {
    console.error("작품 상태 업데이트 실패:", error);
    throw error;
  }

  // 모더레이션 로그 기록 (선택사항)
  try {
    await supabase.from("moderation_logs").insert({
      novel_id: novelId,
      status: status,
      reason: reason || "AI 모더레이션",
      created_at: new Date().toISOString(),
    });
  } catch (logError) {
    // 로그 기록 실패는 무시 (테이블이 없을 수 있음)
    console.warn("모더레이션 로그 기록 실패:", logError);
  }
}

/**
 * 재시도 로직이 포함된 모더레이션 체크
 */
async function moderateWithRetry(
  content: string,
  maxRetries: number = 3
): Promise<ModerationResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await checkModeration(content);
    } catch (error) {
      lastError = error as Error;
      console.warn(`모더레이션 시도 ${attempt}/${maxRetries} 실패:`, error);

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프 (최대 5초)
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 모든 재시도 실패
  throw new Error(
    `모더레이션 체크 실패 (${maxRetries}회 시도): ${lastError?.message}`
  );
}

serve(async (req) => {
  // CORS 헤더 설정
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // OPTIONS 요청 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 요청 본문 파싱
    const { novel_id, episode_id, content, title }: ModerationRequest =
      await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "content 필드가 필요합니다." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 제목과 내용을 합쳐서 체크
    const fullContent = title ? `${title}\n\n${content}` : content;

    // 모더레이션 체크 (재시도 로직 포함)
    let moderationResult: ModerationResponse;
    try {
      moderationResult = await moderateWithRetry(fullContent);
    } catch (error) {
      // 재시도 실패 시에도 로그 기록
      console.error("모더레이션 체크 최종 실패:", error);
      
      // 실패 시 기본값 반환 (안전 우선 - 콘텐츠는 통과)
      moderationResult = {
        flagged: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }

    // 유해 콘텐츠가 감지된 경우
    if (moderationResult.flagged) {
      console.log("유해 콘텐츠 감지:", {
        novel_id,
        episode_id,
        categories: moderationResult.categories,
      });

      // novel_id가 있으면 작품 상태 업데이트
      if (novel_id) {
        const flaggedCategories = Object.entries(
          moderationResult.categories || {}
        )
          .filter(([_, flagged]) => flagged)
          .map(([category, _]) => category)
          .join(", ");

        await updateNovelStatus(
          supabase,
          novel_id,
          "rejected",
          `유해 콘텐츠 감지: ${flaggedCategories}`
        );
      }

      return new Response(
        JSON.stringify({
          flagged: true,
          categories: moderationResult.categories,
          category_scores: moderationResult.category_scores,
          action: novel_id ? "rejected" : "flagged",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 유해 콘텐츠가 없는 경우
    if (novel_id) {
      // 작품 상태를 approved로 업데이트 (pending에서 승인)
      await updateNovelStatus(supabase, novel_id, "approved");
    }

    return new Response(
      JSON.stringify({
        flagged: false,
        action: novel_id ? "approved" : "passed",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("모더레이션 처리 오류:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "알 수 없는 오류",
        flagged: false, // 오류 시 기본적으로 통과 (안전 우선)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
