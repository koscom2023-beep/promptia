"use client";

import { useState } from "react";
import { createComment } from "@/app/actions/comments";

interface Comment {
  id: string;
  nickname: string;
  content: string;
  like_count: number;
  created_at: string;
}

interface CommentsSectionProps {
  episodeId: string;
  novelId: string;
  initialComments: Comment[];
}

export function CommentsSection({
  episodeId,
  novelId,
  initialComments,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await createComment(
        episodeId,
        novelId,
        nickname || "익명",
        content
      );
      setComments([newComment, ...comments]);
      setContent("");
      setNickname("");
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold mb-4">댓글 ({comments.length})</h3>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="닉네임 (선택사항)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
        <textarea
          placeholder="댓글을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? "작성 중..." : "댓글 작성"}
        </button>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{comment.nickname}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <p className="text-gray-700">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-8">댓글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
