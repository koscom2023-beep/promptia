"use client";

import { useState, useEffect } from "react";
import { getUsersForAdmin } from "@/app/actions/admin-dashboard";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UsersTable() {
  const [data, setData] = useState<Array<{ id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getUsersForAdmin({
        page,
        pageSize,
      });
      setData(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error("사용자 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">사용자 목록</h2>
        <div className="text-sm text-gray-400">
          총 {total.toLocaleString()}명
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#5eead4]" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  사용자 ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                    사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                data.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-800 hover:bg-[#1e2433] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white font-mono">
                      {user.id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs bg-green-400/20 text-green-400">
                        활성
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-400">
          페이지 {page} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            size="sm"
            className="bg-[#1e2433] hover:bg-[#252d3d] text-white border border-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            size="sm"
            className="bg-[#1e2433] hover:bg-[#252d3d] text-white border border-gray-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
