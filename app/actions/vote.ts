"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * reCAPTCHA v3 토큰 검증 함수
 * TODO: reCAPTCHA v3 통합 시 구현
 * 
 * @param token - reCAPTCHA v3 토큰
 * @returns 검증 결과
 */
async function verifyRecaptcha(_token: string): Promise<boolean> {
  // TODO: reCAPTCHA v3 검증 로직 구현
  // const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
  // const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //   body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
  // });
  // const data = await response.json();
  // return data.success && data.score > 0.5; // 점수 0.5 이상만 통과
  
  // 현재는 검증 없이 통과 (개발 단계)
  return true;
}

/**
 * 1일 1회 IP 기반 중복 투표 방지 체크
 * 같은 IP가 같은 작품에 대해 24시간 이내에 투표했는지 확인
 */
async function checkDailyVoteLimit(
  supabase: any,
  novelId: string,
  ipAddress: string
): Promise<{ allowed: boolean; error?: string }> {
  // 24시간 이내 투표 기록 확인
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { data: recentVote, error: checkError } = await supabase
    .from("votes")
    .select("id, created_at")
    .eq("novel_id", novelId)
    .eq("ip_address", ipAddress)
    .gte("created_at", oneDayAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116은 "no rows returned" 에러이므로 정상 (투표 없음)
    console.error("투표 확인 중 오류:", checkError);
    return { allowed: false, error: "투표 확인 중 오류가 발생했습니다." };
  }

  if (recentVote) {
    // 24시간 이내 투표 기록이 있음
    const voteTime = new Date(recentVote.created_at);
    const hoursSinceVote = (Date.now() - voteTime.getTime()) / (1000 * 60 * 60);
    const remainingHours = Math.ceil(24 - hoursSinceVote);
    
    return {
      allowed: false,
      error: `하루에 한 번만 투표할 수 있습니다. ${remainingHours}시간 후 다시 투표할 수 있습니다.`,
    };
  }

  return { allowed: true };
}

export async function voteForEpisode(
  episodeId: string,
  recaptchaToken?: string,
  deviceId?: string
) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const { data: { user } } = await supabase.auth.getUser();
    
    // reCAPTCHA v3 검증 (토큰이 제공된 경우)
    if (recaptchaToken) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        return { success: false, error: "reCAPTCHA 검증에 실패했습니다." };
      }
    }
    
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
    const today = new Date().toISOString().split('T')[0];

    // 오늘 이미 투표했는지 확인 (IP, Device ID, User ID 기반)
    let voteQuery = supabase
      .from("votes")
      .select("id")
      .eq("novel_id", novelId)
      .eq("voted_at", today);

    if (user) {
      voteQuery = voteQuery.eq("user_id", user.id);
    } else if (deviceId) {
      voteQuery = voteQuery.eq("device_id", deviceId);
    } else {
      voteQuery = voteQuery.eq("voter_ip", ipAddress);
    }

    const { data: existingVote } = await voteQuery.limit(1).maybeSingle();

    if (existingVote) {
      return { success: false, error: "오늘 이미 투표하셨습니다." };
    }

    // 투표 생성 (새로운 컬럼 포함)
    const { error: insertError } = await supabase.from("votes").insert({
      novel_id: novelId,
      episode_id: episodeId,
      user_id: user?.id || null,
      voter_ip: ipAddress,
      device_id: deviceId || null,
      voted_at: today,
      ip_address: ipAddress, // 레거시 호환
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

    // 게이미피케이션: 투표 XP 지급
    try {
      const { logActivity, checkAndGrantAchievement } = await import("@/app/actions/gamification");
      await logActivity("vote", 5, {
        novel_id: novelId,
        episode_id: episodeId,
      });

      // 첫 투표 업적 체크
      await checkAndGrantAchievement("first_vote");
    } catch (gamificationError) {
      // 게이미피케이션 오류는 무시 (투표는 성공)
      console.warn("게이미피케이션 처리 실패:", gamificationError);
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
