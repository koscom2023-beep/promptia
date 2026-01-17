"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * AI 모더레이션을 통한 콘텐츠 검사
 * Supabase Edge Function을 호출하여 OpenAI Moderation API를 사용
 * 
 * @param novelId - 작품 ID
 * @param content - 검사할 콘텐츠 (본문)
 * @param title - 검사할 제목 (선택)
 * @returns 모더레이션 결과
 */
export async function moderateContent(
  novelId: string,
  content: string,
  title?: string
) {
  const supabase = await createClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("인증이 필요합니다.");
  }

  // Supabase Edge Function 호출
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL이 설정되지 않았습니다.");
  }

  try {
    const { data, error } = await supabase.functions.invoke("moderate-content", {
      body: {
        novel_id: novelId,
        content: content,
        title: title,
      },
    });

    if (error) {
      console.error("모더레이션 함수 호출 실패:", error);
      throw new Error(`모더레이션 실패: ${error.message}`);
    }

    return {
      success: true,
      flagged: data?.flagged || false,
      categories: data?.categories || {},
      category_scores: data?.category_scores || {},
      action: data?.action || "passed",
    };
  } catch (error) {
    console.error("모더레이션 처리 오류:", error);
    throw error;
  }
}

/**
 * 작품 업로드 후 자동 모더레이션
 * 
 * @param novelId - 작품 ID
 * @param title - 작품 제목
 * @param description - 작품 설명
 * @param content - 작품 내용 (에피소드)
 */
export async function autoModerateNovel(
  novelId: string,
  title: string,
  description?: string,
  content?: string
) {
  try {
    // 제목과 설명, 내용을 합쳐서 검사
    const fullContent = [
      title,
      description,
      content,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!fullContent.trim()) {
      return {
        success: false,
        error: "검사할 콘텐츠가 없습니다.",
      };
    }

    const result = await moderateContent(novelId, fullContent, title);

    return result;
  } catch (error) {
    console.error("자동 모더레이션 실패:", error);
    // 모더레이션 실패 시에도 작품은 pending 상태로 유지
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
      flagged: false, // 오류 시 기본적으로 통과
    };
  }
}

/**
 * 명예의 전당 조회
 * 
 * @param weeks - 조회할 주 수 (기본값: 4)
 */
export async function getHallOfFame(weeks: number = 4) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hall_of_fame")
    .select(
      `
      id,
      week_start_date,
      rank,
      weekly_xp,
      user_id
    `
    )
    .order("week_start_date", { ascending: false })
    .order("rank", { ascending: true })
    .limit(weeks * 3); // 주당 3명

  if (error) {
    console.error("명예의 전당 조회 실패:", error);
    return [];
  }

  return data || [];
}

/**
 * 주간 리셋 수동 실행 (관리자용)
 */
export async function manualWeeklyReset() {
  const supabase = await createClient();

  // 관리자 권한 확인 (추가 필요)
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user || user.user_metadata?.role !== 'admin') {
  //   throw new Error("관리자 권한이 필요합니다.");
  // }

  const { data, error } = await supabase.rpc("manual_weekly_reset");

  if (error) {
    console.error("주간 리셋 실패:", error);
    throw new Error(`주간 리셋 실패: ${error.message}`);
  }

  return { success: true };
}
