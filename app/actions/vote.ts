"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function voteForEpisode(episodeId: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // IP 주소 가져오기
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // 이미 해당 에피소드에 해당 IP로 투표했는지 확인
    const { data: existingVote, error: checkError } = await supabase
      .from("votes")
      .select("id")
      .eq("episode_id", episodeId)
      .eq("ip_address", ipAddress)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러이므로 정상 (투표 없음)
      console.error("투표 확인 중 오류:", checkError);
      return { success: false, error: "투표 확인 중 오류가 발생했습니다." };
    }

    if (existingVote) {
      return { success: false, error: "이미 투표하셨습니다." };
    }

    // 에피소드 정보 가져오기 (novel_id와 user_id를 위해)
    const { data: episode, error: episodeError } = await supabase
      .from("episodes")
      .select("novel_id, user_id")
      .eq("id", episodeId)
      .single();

    if (episodeError || !episode) {
      return { success: false, error: "에피소드를 찾을 수 없습니다." };
    }

    // 현재 사용자 정보 가져오기 (익명 사용자도 가능)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // user_id는 필수이므로, 익명 사용자의 경우에도 자신의 익명 사용자 ID 사용
    // AuthContext에서 이미 익명 로그인을 처리하므로 user?.id가 존재해야 함
    const userId = user?.id || episode.user_id;

    // 투표 생성
    const { error: insertError } = await supabase.from("votes").insert({
      novel_id: episode.novel_id,
      episode_id: episodeId,
      user_id: userId,
      ip_address: ipAddress,
    });

    if (insertError) {
      console.error("투표 생성 오류:", insertError);
      return { success: false, error: "투표 생성 중 오류가 발생했습니다." };
    }

    // 페이지 재검증하여 UI 업데이트
    revalidatePath(`/novels/${episode.novel_id}/${episodeId}`);

    return { success: true };
  } catch (error) {
    console.error("투표 처리 중 오류:", error);
    return { success: false, error: "투표 처리 중 오류가 발생했습니다." };
  }
}
