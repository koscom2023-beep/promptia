"use client";

/**
 * AI 자동 검수 큐 컴포넌트
 * 
 * OpenAI Moderation API로 flagged된 작품들을 표시하고
 * 관리자가 승인/반려할 수 있도록 합니다.
 */

import { useState, useEffect } from "react";
import { getNovelsForAdmin, updateNovelStatus } from "@/app/actions/admin-dashboard";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Novel {
  id: string;
  title: string;
  type: "novel" | "webtoon" | "video";
  created_at: string;
  is_blocked: boolean;
}

export function ModerationQueue() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingNovels();
  }, []);

  const loadPendingNovels = async () => {
    try {
      setLoading(true);
      // pending 상태의 작품 가져오기 (현재는 모든 작품을 표시)
      const result = await getNovelsForAdmin({
        page: 1,
        pageSize: 10,
        status: "all",
        sortBy: "created_at",
        sortOrder: "desc",
      });
      setNovels(result.data as Novel[]);
    } catch (error) {
      console.error("작품 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    novelId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      setProcessing(novelId);
      await updateNovelStatus(novelId, status);
      await loadPendingNovels();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">AI 모더레이션 큐</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#5eead4]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">AI 모더레이션 큐</h2>
        <span className="text-sm text-gray-400">
          {novels.length}개 작품 대기 중
        </span>
      </div>

      <div className="space-y-3">
        {novels.length === 0 ? (
          <p className="text-gray-400 text-center py-8">대기 중인 작품이 없습니다.</p>
        ) : (
          novels.map((novel) => (
            <div
              key={novel.id}
              className="flex items-center justify-between p-4 bg-[#1e2433] rounded-lg border border-gray-800"
            >
              <div className="flex-1">
                <h3 className="font-medium text-white">{novel.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span className="capitalize">{novel.type}</span>
                  <span>•</span>
                  <span>
                    {new Date(novel.created_at).toLocaleDateString("ko-KR")}
                  </span>
                  {novel.is_blocked && (
                    <>
                      <span>•</span>
                      <span className="text-red-400">차단됨</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {processing === novel.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(novel.id, "approved")}
                      disabled={!novel.is_blocked}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(novel.id, "rejected")}
                      disabled={novel.is_blocked}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X className="w-4 h-4 mr-1" />
                      거부
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
