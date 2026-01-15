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

    // 에피소드 정보 가져오기 (novel_id를 위해)
    const { data: episode, error: episodeError } = await supabase
      .from("episodes")
      .select("novel_id")
      .eq("id", episodeId)
      .single();

    if (episodeError || !episode) {
      return { success: false, error: "에피소드를 찾을 수 없습니다." };
    }

    const novelId = episode.novel_id;

    // 이미 해당 작품에 해당 IP로 투표했는지 확인
    const { data: existingVote, error: checkError } = await supabase
      .from("votes")
      .select("id")
      .eq("novel_id", novelId)
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

    // 투표 생성
    const { error: insertError } = await supabase.from("votes").insert({
      novel_id: novelId,
      ip_address: ipAddress,
    });

    if (insertError) {
      console.error("투표 생성 오류:", insertError);
      return { success: false, error: "투표 생성 중 오류가 발생했습니다." };
    }

    // 작품의 vote_count 증가
    const { data: novel } = await supabase
      .from("novels")
      .select("vote_count")
      .eq("id", novelId)
      .single();

    if (novel) {
      await supabase
        .from("novels")
        .update({ vote_count: (novel.vote_count || 0) + 1 })
        .eq("id", novelId);
    }

    // 페이지 재검증하여 UI 업데이트
    revalidatePath(`/novels/${novelId}/${episodeId}`);

    return { success: true };
  } catch (error) {
    console.error("투표 처리 중 오류:", error);
    return { success: false, error: "투표 처리 중 오류가 발생했습니다." };
  }
}

export async function voteForNovel(novelId: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // IP 주소 가져오기
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // 이미 해당 작품에 해당 IP로 투표했는지 확인
    const { data: existingVote, error: checkError } = await supabase
      .from("votes")
      .select("id")
      .eq("novel_id", novelId)
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

    // 투표 생성
    const { error: insertError } = await supabase.from("votes").insert({
      novel_id: novelId,
      ip_address: ipAddress,
    });

    if (insertError) {
      console.error("투표 생성 오류:", insertError);
      return { success: false, error: "투표 생성 중 오류가 발생했습니다." };
    }

    // 작품의 vote_count 증가
    const { data: novel } = await supabase
      .from("novels")
      .select("vote_count")
      .eq("id", novelId)
      .single();

    if (novel) {
      await supabase
        .from("novels")
        .update({ vote_count: (novel.vote_count || 0) + 1 })
        .eq("id", novelId);
    }

    // 페이지 재검증하여 UI 업데이트
    revalidatePath(`/view/${novelId}`);

    return { success: true };
  } catch (error) {
    console.error("투표 처리 중 오류:", error);
    return { success: false, error: "투표 처리 중 오류가 발생했습니다." };
  }
}
