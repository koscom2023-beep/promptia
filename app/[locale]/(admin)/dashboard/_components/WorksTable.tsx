"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { getNovelsForAdmin } from "@/app/actions/admin-dashboard";
import { ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Novel {
  id: string;
  title: string;
  description: string | null;
  type: "novel" | "webtoon" | "video";
  thumbnail_url: string | null;
  view_count: number;
  vote_count: number;
  created_at: string;
  is_blocked: boolean;
}

export function WorksTable() {
  const [data, setData] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "novel" | "webtoon" | "video">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

  useEffect(() => {
    loadData();
  }, [page, search, typeFilter, statusFilter, sorting]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getNovelsForAdmin({
        page,
        pageSize,
        search: search || undefined,
        type: typeFilter,
        status: statusFilter,
        sortBy: sorting[0]?.id as any,
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      });
      setData(result.data as Novel[]);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error("작품 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<Novel>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-[#5eead4]"
          >
            제목
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="max-w-xs truncate">{row.getValue("title")}</div>
        ),
      },
      {
        accessorKey: "type",
        header: "타입",
        cell: ({ row }) => (
          <span className="capitalize">{row.getValue("type")}</span>
        ),
      },
      {
        accessorKey: "view_count",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-[#5eead4]"
          >
            조회수
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: ({ row }) => (row.getValue("view_count") as number).toLocaleString(),
      },
      {
        accessorKey: "vote_count",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-[#5eead4]"
          >
            투표수
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: ({ row }) => (row.getValue("vote_count") as number).toLocaleString(),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-[#5eead4]"
          >
            생성일
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: ({ row }) =>
          new Date(row.getValue("created_at")).toLocaleDateString("ko-KR"),
      },
      {
        accessorKey: "is_blocked",
        header: "상태",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded text-xs ${
              row.getValue("is_blocked")
                ? "bg-red-400/20 text-red-400"
                : "bg-green-400/20 text-green-400"
            }`}
          >
            {row.getValue("is_blocked") ? "차단됨" : "승인됨"}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
  });

  return (
    <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">작품 목록</h2>
        <div className="text-sm text-gray-400">
          총 {total.toLocaleString()}개
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="제목 검색..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs bg-[#1e2433] border-gray-700 text-white"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as any);
            setPage(1);
          }}
          className="px-3 py-2 bg-[#1e2433] border border-gray-700 rounded text-white"
        >
          <option value="all">모든 타입</option>
          <option value="novel">소설</option>
          <option value="webtoon">웹툰</option>
          <option value="video">영상</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(1);
          }}
          className="px-3 py-2 bg-[#1e2433] border border-gray-700 rounded text-white"
        >
          <option value="all">모든 상태</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거부됨</option>
          <option value="pending">대기 중</option>
        </select>
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
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-400"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-800 hover:bg-[#1e2433] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-white">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
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
