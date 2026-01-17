"use client"

import { Eye, Heart, Crown, Medal, Award } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface RankingItem {
  id: string
  rank: number
  title: string
  author?: string
  genre?: string
  views: number | string
  likes: number | string
  imageUrl: string
  type?: "novel" | "webtoon" | "video"
}

interface RankingSectionProps {
  title: string
  items: RankingItem[]
}

export function RankingSection({ title, items }: RankingSectionProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-amber-400" />
      case 2:
        return <Medal className="w-4 h-4 text-slate-300" />
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />
      default:
        return null
    }
  }

  const formatNumber = (num: number | string): string => {
    if (typeof num === "string") return num
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`
    return num.toLocaleString()
  }

  return (
    <section className="px-4 md:px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
          <a href="#" className="text-sm text-slate-400 hover:text-[#5eead4] transition">
            전체보기
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {items.slice(0, 10).map((item) => {
            const ImageWithError = ({ item }: { item: RankingItem }) => {
              const [imgError, setImgError] = useState(false)
              // 더 나은 기본 이미지 URL 사용
              const defaultImage = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80"
              
              // imageUrl이 없거나 빈 문자열이면 기본 이미지 사용
              const imageSrc = (!item.imageUrl || item.imageUrl.trim() === '' || imgError) 
                ? defaultImage 
                : item.imageUrl
              
              return (
                <img
                  src={imageSrc}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => {
                    if (!imgError) {
                      setImgError(true)
                    }
                  }}
                />
              )
            }
            
            return (
            <Link key={item.id} href={`/novels/${item.id}`}>
              <div className="group flex items-center gap-4 p-3 rounded-xl bg-[#252d3d]/50 hover:bg-[#252d3d] transition-all cursor-pointer">
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(item.rank) || <span className="text-base font-bold text-slate-500">{item.rank}</span>}
                </div>

                {/* Book cover */}
                <div className="w-12 h-[68px] rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                  <ImageWithError item={item} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-[#5eead4] transition">
                    {item.title}
                  </h3>
                  {item.author && <p className="text-xs text-slate-500 mt-0.5">{item.author}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    {item.genre && (
                      <span className="inline-block px-2 py-0.5 bg-slate-700/50 rounded text-slate-400">{item.genre}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(item.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatNumber(item.likes)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
