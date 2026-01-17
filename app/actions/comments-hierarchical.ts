"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity, checkAndGrantAchievement } from "./gamification";

/**
 * 계층형 댓글 인터페이스
 */
export interface HierarchicalComment {
  id: string;
  novel_id: string;
  user_nickname: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  depth: number;
  path: string;
  replies?: HierarchicalComment[];
  user_reputation?: number;
  user_badge?: string | null;
}

/**
 * 댓글 작성 (대댓글 지원)
 */
export async function createComment(
  novelId: string,
  userNickname: string,
  content: string,
  parentId?: string | null
): Promise<HierarchicalComment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      novel_id: novelId,
      user_nickname: userNickname.trim() || "익명",
      content: content.trim(),
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // 게이미피케이션: 댓글 작성 XP 지급
  try {
    const activityType = parentId ? "reply" : "comment";
    const xpAmount = parentId ? 5 : 10; // 대댓글은 5 XP, 일반 댓글은 10 XP
    
    await logActivity(activityType, xpAmount, {
      comment_id: data.id,
      novel_id: novelId,
      parent_id: parentId || null,
    });

    // 첫 댓글 업적 체크
    if (!parentId) {
      await checkAndGrantAchievement("first_comment");
    }
  } catch (gamificationError) {
    // 게이미피케이션 오류는 무시 (댓글 작성은 성공)
    console.warn("게이미피케이션 처리 실패:", gamificationError);
  }

  // 평판 점수는 트리거로 자동 증가
  // 재검증
  revalidatePath(`/novels/${novelId}`);

  return {
    ...data,
    depth: parentId ? 1 : 0,
    path: data.id,
  };
}

/**
 * 재귀 쿼리를 사용하여 계층형 댓글 가져오기
 */
export async function getCommentsHierarchical(
  novelId: string
): Promise<HierarchicalComment[]> {
  const supabase = await createClient();

  // Supabase RPC 함수 호출
  const { data, error } = await supabase.rpc("get_comments_with_replies", {
    novel_id_param: novelId,
  });

  if (error) {
    // RPC 함수가 없으면 일반 쿼리로 폴백
    console.warn("RPC 함수 호출 실패, 일반 쿼리로 폴백:", error);
    return await getCommentsFallback(novelId);
  }

  // 사용자 평판 정보 가져오기
  const commentsWithReputation = await enrichCommentsWithReputation(
    data || []
  );

  // 평면 구조를 계층 구조로 변환
  return buildCommentTree(commentsWithReputation);
}

/**
 * 폴백: 일반 쿼리로 댓글 가져오기 (RPC 함수가 없는 경우)
 */
async function getCommentsFallback(
  novelId: string
): Promise<HierarchicalComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, novel_id, user_nickname, content, parent_id, created_at")
    .eq("novel_id", novelId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // depth 계산 및 트리 구조 생성
  const comments = (data || []).map((comment) => ({
    ...comment,
    depth: 0, // 클라이언트에서 계산
    path: comment.id,
  }));

  const commentsWithReputation = await enrichCommentsWithReputation(comments);
  return buildCommentTree(commentsWithReputation);
}

/**
 * 댓글에 사용자 평판 정보 추가
 */
async function enrichCommentsWithReputation(
  comments: Array<{
    id: string;
    user_nickname: string;
    [key: string]: any;
  }>
): Promise<HierarchicalComment[]> {
  // 사용자 닉네임으로 profiles 조회 (현재는 author_id 기반이므로 임시로 처리)
  // 실제로는 user_id를 comments 테이블에 추가해야 정확한 조회가 가능합니다
  const enrichedComments = await Promise.all(
    comments.map(async (comment) => {
      // 현재 스키마에는 user_id가 없으므로, 
      // 추후 user_id 컬럼이 추가되면 아래와 같이 조회 가능:
      // const supabase = await createClient();
      // const { data: profile } = await supabase
      //   .from("profiles")
      //   .select("reputation_score, badge")
      //   .eq("id", comment.user_id)
      //   .single();

      // 임시로 null 반환 (추후 user_id 추가 시 구현)
      return {
        ...comment,
        user_reputation: null,
        user_badge: null,
      } as unknown as HierarchicalComment;
    })
  );

  return enrichedComments;
}

/**
 * 평면 구조를 계층 구조로 변환
 */
function buildCommentTree(
  comments: HierarchicalComment[]
): HierarchicalComment[] {
  const commentMap = new Map<string, HierarchicalComment>();
  const rootComments: HierarchicalComment[] = [];

  // 모든 댓글을 맵에 저장
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // 계층 구조 생성
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!;

    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        // 3단계 이상은 평면화 (부모의 부모의 부모에 직접 추가)
        if (comment.depth >= 3) {
          // 최상위 부모 찾기
          let topParent = parent;
          while (topParent.parent_id) {
            const grandParent = commentMap.get(topParent.parent_id);
            if (grandParent) {
              topParent = grandParent;
            } else {
              break;
            }
          }
          topParent.replies = topParent.replies || [];
          topParent.replies.push(commentWithReplies);
        } else {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string, novelId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/novels/${novelId}`);
}

/**
 * 사용자 평판 정보 가져오기
 */
export async function getUserReputation(userId: string): Promise<{
  reputation_score: number;
  badge: string | null;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("reputation_score, badge")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    reputation_score: data.reputation_score || 0,
    badge: data.badge,
  };
}
