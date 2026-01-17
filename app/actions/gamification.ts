"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 활동 로그 타입
 */
export type ActivityType =
  | "comment"
  | "vote"
  | "upload"
  | "daily_login"
  | "reply"
  | "view";

/**
 * 활동 로그 기록
 * @param activityType - 활동 유형
 * @param xpEarned - 획득한 XP
 * @param metadata - 추가 메타데이터 (작품 ID, 댓글 ID 등)
 */
export async function logActivity(
  activityType: ActivityType,
  xpEarned: number,
  metadata?: Record<string, any>
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

  // 활동 로그 삽입 (트리거가 자동으로 프로필 업데이트)
  const { error } = await supabase.from("activity_logs").insert({
    user_id: user.id,
    activity_type: activityType,
    xp_earned: xpEarned,
    metadata: metadata || {},
    activity_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD 형식
  });

  if (error) {
    console.error("활동 로그 기록 실패:", error);
    throw new Error("활동 로그 기록에 실패했습니다.");
  }

  // 캐시 무효화
  revalidatePath("/");
}

/**
 * 사용자 게이미피케이션 프로필 조회
 */
export async function getGamificationProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("gamification_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // 프로필이 없으면 기본값 반환
    if (error.code === "PGRST116") {
      return {
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        total_xp: 0,
        weekly_xp: 0,
        level: 1,
        last_activity_at: null,
      };
    }
    console.error("프로필 조회 실패:", error);
    return null;
  }

  return data;
}

/**
 * 사용자 업적 목록 조회
 */
export async function getUserAchievements() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_achievements")
    .select(
      `
      id,
      unlocked_at,
      achievements (
        id,
        code,
        name,
        description,
        icon_url,
        xp_reward,
        category
      )
    `
    )
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false });

  if (error) {
    console.error("업적 조회 실패:", error);
    return [];
  }

  return data || [];
}

/**
 * 사용자 활동 로그 조회
 * @param limit - 조회할 로그 수 (기본값: 50)
 */
export async function getActivityLogs(limit: number = 50) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("활동 로그 조회 실패:", error);
    return [];
  }

  return data || [];
}

/**
 * 업적 달성 체크 및 부여
 * @param achievementCode - 업적 코드
 */
export async function checkAndGrantAchievement(achievementCode: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  // 이미 달성했는지 확인
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", user.id)
    .eq("achievements.code", achievementCode)
    .single();

  if (existing) {
    return false; // 이미 달성함
  }

  // 업적 정보 조회
  const { data: achievement, error: achievementError } = await supabase
    .from("achievements")
    .select("*")
    .eq("code", achievementCode)
    .eq("is_active", true)
    .single();

  if (achievementError || !achievement) {
    return false;
  }

  // 업적 부여
  const { error: insertError } = await supabase
    .from("user_achievements")
    .insert({
      user_id: user.id,
      achievement_id: achievement.id,
    });

  if (insertError) {
    console.error("업적 부여 실패:", insertError);
    return false;
  }

  // 업적 보상 XP 지급
  if (achievement.xp_reward > 0) {
    await logActivity("daily_login", achievement.xp_reward, {
      achievement_code: achievementCode,
    });
  }

  return true;
}

/**
 * Streak 수동 계산 (테스트용)
 */
export async function calculateStreak() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase.rpc("calculate_user_streak", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Streak 계산 실패:", error);
    return null;
  }

  return data;
}
