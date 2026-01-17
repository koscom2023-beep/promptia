"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getDailyVoteStats,
  getDailySignupStats,
} from "@/app/actions/admin-dashboard";
import { Loader2 } from "lucide-react";

export function ChartsSection() {
  const [voteStats, setVoteStats] = useState<
    Array<{ date: string; votes: number }>
  >([]);
  const [signupStats, setSignupStats] = useState<
    Array<{ date: string; signups: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [votes, signups] = await Promise.all([
        getDailyVoteStats(7),
        getDailySignupStats(7),
      ]);
      setVoteStats(votes);
      setSignupStats(signups);
    } catch (error) {
      console.error("통계 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#5eead4]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 일일 투표 수 차트 */}
      <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-bold mb-4">일일 투표 수 (최근 7일)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={voteStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e2433",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="votes"
              stroke="#5eead4"
              strokeWidth={2}
              name="투표 수"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 일일 신규 가입자 차트 */}
      <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-bold mb-4">일일 신규 가입자 (최근 7일)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={signupStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e2433",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="signups" fill="#a78bfa" name="신규 가입자" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
