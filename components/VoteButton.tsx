"use client";

import { useState, useOptimistic, useTransition } from "react";
import { voteForEpisode } from "@/app/actions/vote";

interface VoteButtonProps {
  episodeId: string;
  hasVoted: boolean;
  voteCount: number;
}

export function VoteButton({ episodeId, hasVoted, voteCount }: VoteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [voted, setVoted] = useState(hasVoted);
  
  // 낙관적 업데이트: 서버 응답 전에 UI 즉시 업데이트
  const [optimisticCount, setOptimisticCount] = useOptimistic(
    voteCount,
    (currentCount, increment: number) => currentCount + increment
  );

  const handleVote = async () => {
    if (voted || isPending) return;

    // 1️⃣ 즉시 UI 업데이트 (낙관적 업데이트)
    setVoted(true);
    setOptimisticCount(1); // +1 증가

    // 2️⃣ 서버 요청 (백그라운드)
    startTransition(async () => {
      try {
        const result = await voteForEpisode(episodeId);
        
        if (!result.success) {
          // 실패 시 롤백
          setVoted(false);
          setOptimisticCount(-1); // -1 감소 (원상복구)
          alert(result.error || "투표에 실패했습니다.");
        }
        // 성공 시 UI는 이미 업데이트되어 있음
      } catch (error) {
        // 에러 시 롤백
        setVoted(false);
        setOptimisticCount(-1);
        console.error("투표 오류:", error);
        alert("투표 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 투표 수 표시 (낙관적 업데이트) */}
      <div className="text-center">
        <div className="text-4xl font-bold text-[#5eead4] mb-1">
          {optimisticCount.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400">
          {optimisticCount === 1 ? "투표" : "투표"}
        </div>
      </div>

      {/* 투표 버튼 */}
      <button
        onClick={handleVote}
        disabled={voted || isPending}
        className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform ${
          voted
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-[#5eead4] text-[#1e2433] hover:bg-[#2dd4bf] hover:scale-105 shadow-lg"
        } ${!voted && !isPending ? "hover:shadow-xl" : ""} ${
          isPending ? "opacity-75" : ""
        }`}
      >
        {voted ? (
          <span className="flex items-center gap-2">
            ✓ 투표 완료
          </span>
        ) : (
          <span className="flex items-center gap-2">
            ❤️ 오늘의 PICK
          </span>
        )}
      </button>

      {/* 로딩 인디케이터 (백그라운드 처리 중) */}
      {isPending && !voted && (
        <div className="text-xs text-gray-500 animate-pulse">
          서버에 저장 중...
        </div>
      )}
    </div>
  );
}
