"use client";

import { useState } from "react";
import { reportNovel } from "@/app/actions/report";

interface ReportButtonProps {
  novelId: string;
  episodeId: string;
}

export function ReportButton({ novelId, episodeId }: ReportButtonProps) {
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async () => {
    const reason = prompt("신고 사유를 입력해주세요:");
    if (!reason || !reason.trim()) return;

    setIsReporting(true);
    try {
      const result = await reportNovel(novelId, episodeId, reason);
      if (result.success) {
        alert(result.message || "신고가 접수되었습니다.");
      } else {
        alert(result.error || "신고에 실패했습니다.");
      }
    } catch (error) {
      console.error("신고 오류:", error);
      alert("신고 중 오류가 발생했습니다.");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <button
      onClick={handleReport}
      disabled={isReporting}
      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors"
    >
      {isReporting ? "신고 중..." : "신고하기"}
    </button>
  );
}
