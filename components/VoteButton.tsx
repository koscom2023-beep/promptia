"use client";

import { useState } from "react";
import { voteForEpisode } from "@/app/actions/vote";

interface VoteButtonProps {
  episodeId: string;
  hasVoted: boolean;
  voteCount: number;
}

export function VoteButton({ episodeId, hasVoted, voteCount }: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(hasVoted);
  const [count, setCount] = useState(voteCount);

  const handleVote = async () => {
    if (voted || isVoting) return;

    setIsVoting(true);
    try {
      const result = await voteForEpisode(episodeId);
      if (result.success) {
        setVoted(true);
        setCount(count + 1);
      } else {
        alert(result.error || "투표에 실패했습니다.");
      }
    } catch (error) {
      console.error("투표 오류:", error);
      alert("투표 중 오류가 발생했습니다.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={voted || isVoting}
      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
        voted
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isVoting ? "투표 중..." : voted ? "이미 투표했습니다" : "추천하기"}
    </button>
  );
}
