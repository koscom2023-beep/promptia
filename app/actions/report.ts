"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * IP 주소 가져오기
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * 작품 신고
 */
export async function reportNovel(
  novelId: string,
  episodeId: string | null,
  reason: string
) {
  const supabase = await createClient();
  const ipAddress = await getClientIp();

  // 이미 신고했는지 확인
  const { data: existingReport } = await supabase
    .from("reports")
    .select("id")
    .eq("novel_id", novelId)
    .eq("ip_address", ipAddress)
    .single();

  if (existingReport) {
    return {
      success: false,
      error: "이미 신고하신 작품입니다.",
    };
  }

  // 신고 추가
  const { error } = await supabase
    .from("reports")
    .insert({
      novel_id: novelId,
      episode_id: episodeId,
      reason: reason,
      ip_address: ipAddress,
    });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "신고가 접수되었습니다.",
  };
}
