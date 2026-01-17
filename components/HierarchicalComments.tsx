"use client";

import { useState } from "react";
import { createComment, type HierarchicalComment } from "@/app/actions/comments-hierarchical";
import { Reply, ChevronDown, ChevronRight, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface HierarchicalCommentsProps {
  novelId: string;
  initialComments: HierarchicalComment[];
}

/**
 * 뱃지 아이콘 컴포넌트
 */
function BadgeIcon({ badge }: { badge: string | null }) {
  if (!badge) return null;

  const badgeConfig: Record<string, { label: string; color: string }> = {
    legend: { label: "전설", color: "text-purple-400" },
    master: { label: "마스터", color: "text-yellow-400" },
    expert: { label: "전문가", color: "text-blue-400" },
    veteran: { label: "베테랑", color: "text-green-400" },
    advanced: { label: "고급", color: "text-cyan-400" },
    intermediate: { label: "중급", color: "text-orange-400" },
    beginner: { label: "초급", color: "text-gray-400" },
  };

  const config = badgeConfig[badge];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} bg-${config.color.replace('text-', '')}/10`}>
      <Award className="w-3 h-3" />
      {config.label}
    </span>
  );
}

/**
 * 개별 댓글 컴포넌트 (재귀적)
 */
function CommentItem({
  comment,
  novelId,
  depth = 0,
  onReply,
}: {
  comment: HierarchicalComment;
  novelId: string;
  depth?: number;
  onReply: (parentId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyNickname, setReplyNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 3; // 최대 3단계까지만 표시

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment(novelId, replyNickname || "익명", replyContent, comment.id);
      setReplyContent("");
      setReplyNickname("");
      setShowReplyForm(false);
      // 페이지 새로고침 대신 상태 업데이트 (추후 구현)
      window.location.reload();
    } catch (error) {
      console.error("대댓글 작성 오류:", error);
      alert("대댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3단계 이상은 평면화 표시
  const isFlattened = depth >= maxDepth;

  return (
    <div
      className={`${
        depth > 0 ? "ml-6 border-l-2 border-gray-700 pl-4" : ""
      } ${isFlattened ? "opacity-75" : ""}`}
    >
      <div className="bg-[#1e2433] rounded-lg p-4 mb-2">
        {/* 댓글 헤더 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-white">
            {comment.user_nickname || "익명"}
          </span>
          {comment.user_badge && <BadgeIcon badge={comment.user_badge} />}
          {comment.user_reputation !== null && comment.user_reputation !== undefined && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {comment.user_reputation}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isFlattened && (
            <span className="text-xs text-gray-500">(평면화됨)</span>
          )}
        </div>

        {/* 댓글 내용 */}
        <p className="text-gray-300 mb-3 whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* 대댓글 버튼 */}
        {!isFlattened && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-sm text-[#5eead4] hover:text-[#2dd4bf] transition-colors"
          >
            <Reply className="w-4 h-4" />
            답글
          </button>
        )}

        {/* 대댓글 작성 폼 */}
        {showReplyForm && !isFlattened && (
          <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
            <Input
              type="text"
              placeholder="닉네임 (선택사항)"
              value={replyNickname}
              onChange={(e) => setReplyNickname(e.target.value)}
              className="bg-[#161b26] border-gray-700 text-white text-sm"
            />
            <Textarea
              placeholder="대댓글을 입력하세요"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="bg-[#161b26] border-gray-700 text-white text-sm"
            />
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !replyContent.trim()}
                className="bg-[#5eead4] hover:bg-[#2dd4bf] text-[#1e2433]"
              >
                {isSubmitting ? "작성 중..." : "작성"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent("");
                  setReplyNickname("");
                }}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                취소
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* 대댓글 목록 */}
      {hasReplies && (
        <div className="mt-2">
          {isExpanded ? (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 mb-2"
            >
              <ChevronDown className="w-4 h-4" />
              {comment.replies!.length}개의 답글 숨기기
            </button>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 mb-2"
            >
              <ChevronRight className="w-4 h-4" />
              {comment.replies!.length}개의 답글 보기
            </button>
          )}

          {isExpanded &&
            comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                novelId={novelId}
                depth={depth + 1}
                onReply={onReply}
              />
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * 계층형 댓글 섹션 메인 컴포넌트
 */
export function HierarchicalComments({
  novelId,
  initialComments,
}: HierarchicalCommentsProps) {
  const [comments] = useState(initialComments);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment(
        novelId,
        nickname || "익명",
        content,
        null // 루트 댓글
      );
      // 페이지 새로고침으로 최신 댓글 가져오기 (추후 상태 업데이트로 개선 가능)
      window.location.reload();
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (_parentId: string) => {
    // 답글 작성은 CommentItem 내부에서 처리
  };

  const totalComments = comments.reduce((acc, comment) => {
    const countReplies = (c: HierarchicalComment): number => {
      return 1 + (c.replies?.reduce((sum, r) => sum + countReplies(r), 0) || 0);
    };
    return acc + countReplies(comment);
  }, 0);

  return (
    <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
      <h3 className="text-xl font-bold mb-4 text-white">
        댓글 ({totalComments})
      </h3>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <Input
          type="text"
          placeholder="닉네임 (선택사항)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="bg-[#1e2433] border-gray-700 text-white"
        />
        <Textarea
          placeholder="댓글을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="bg-[#1e2433] border-gray-700 text-white"
        />
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="bg-[#5eead4] hover:bg-[#2dd4bf] text-[#1e2433]"
        >
          {isSubmitting ? "작성 중..." : "댓글 작성"}
        </Button>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">댓글이 없습니다.</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              novelId={novelId}
              depth={0}
              onReply={handleReply}
            />
          ))
        )}
      </div>
    </div>
  );
}
