"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * IP 주소 가져오기
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * 댓글 작성
 */
export async function createComment(
  _episodeId: string,
  novelId: string,
  nickname: string,
  content: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      novel_id: novelId,
      user_nickname: nickname.trim() || "익명",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 댓글 목록 가져오기
 */
export async function getComments(_episodeId: string, novelId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, user_nickname, content, created_at")
    .eq("novel_id", novelId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * 댓글 좋아요 상태 확인
 */
export async function checkCommentLikeStatus(commentId: string): Promise<boolean> {
  const supabase = await createClient();
  const ipAddress = await getClientIp();

  const { data } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("ip_address", ipAddress)
    .single();

  return !!data;
}

/**
 * 댓글 좋아요 토글
 */
export async function toggleCommentLike(commentId: string) {
  const supabase = await createClient();
  const ipAddress = await getClientIp();

  // 이미 좋아요를 눌렀는지 확인
  const { data: existingLike } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("ip_address", ipAddress)
    .single();

  if (existingLike) {
    // 좋아요 취소
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("ip_address", ipAddress);

    if (error) throw new Error(error.message);
    return { liked: false };
  } else {
    // 좋아요 추가
    const { error } = await supabase
      .from("comment_likes")
      .insert({
        comment_id: commentId,
        ip_address: ipAddress,
      });

    if (error) throw new Error(error.message);
    return { liked: true };
  }
}
