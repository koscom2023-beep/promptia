"use client";

import { BookOpen, Vote, Shield, TrendingUp, FileX } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalNovels: number;
    blockedNovels: number;
    totalVotes: number;
    todayVotes: number;
    todayNovels: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "총 작품 수",
      value: stats.totalNovels.toLocaleString(),
      icon: BookOpen,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      title: "차단된 작품",
      value: stats.blockedNovels.toLocaleString(),
      icon: FileX,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
    {
      title: "총 투표 수",
      value: stats.totalVotes.toLocaleString(),
      icon: Vote,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      title: "오늘의 투표",
      value: stats.todayVotes.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      title: "오늘의 신규 작품",
      value: stats.todayNovels.toLocaleString(),
      icon: Shield,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-lg p-6 border border-gray-800`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <h3 className="text-sm text-gray-400 mb-1">{card.title}</h3>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
