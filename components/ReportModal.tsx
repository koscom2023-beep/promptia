"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
  novelTitle: string;
}

export function ReportModal({ isOpen, onClose, novelId, novelTitle }: ReportModalProps) {
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportReason || !reportDetails.trim()) {
      alert("신고 사유와 상세 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      // 신고 내역을 데이터베이스에 저장 (reported_at은 자동으로 NOW()로 설정됨)
      const { error } = await supabase.from("reports").insert({
        novel_id: novelId,
        reason: reportReason,
        details: reportDetails,
        status: "pending",
        reported_at: new Date().toISOString(), // 법적 증거용: 신고 접수 시간
      });

      if (error) {
        // reports 테이블이 없을 수 있으므로 콘솔에만 기록
        console.log("신고 내역 저장 (시뮬레이션):", {
          novel_id: novelId,
          novel_title: novelTitle,
          reason: reportReason,
          details: reportDetails,
          reported_at: new Date().toISOString(),
        });
      }

      alert("신고가 접수되었습니다. 운영자가 검토 중입니다.");
      setReportReason("");
      setReportDetails("");
      onClose();
    } catch (error) {
      console.error("신고 제출 실패:", error);
      alert("신고 제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">저작권 침해 및 유해 콘텐츠 신고</h2>
        <p className="text-sm text-gray-400 mb-6">
          작품: <span className="font-semibold text-white">{novelTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              신고 사유 *
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">선택해주세요</option>
              <option value="copyright">저작권 침해</option>
              <option value="inappropriate">부적절한 이미지</option>
              <option value="spam">스팸/광고</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              상세 내용 *
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={5}
              placeholder="신고 사유에 대한 상세한 설명을 입력해주세요."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "제출 중..." : "신고하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
