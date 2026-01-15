"use client"

import { ChevronLeft, ChevronRight, Clock, Sparkles, Zap } from "lucide-react"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface SectionItem {
  id: string
  title: string
  author?: string
  imageUrl: string
  badge?: "UP" | "NEW" | "독점"
}

interface HorizontalSectionProps {
  title: string
  items: SectionItem[]
}

export function HorizontalSection({ title, items }: HorizontalSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case "UP":
        return {
          className: "bg-[#5eead4] text-[#1e2433]",
          icon: <Clock className="w-3 h-3" />,
        }
      case "NEW":
        return {
          className: "bg-[#a78bfa] text-white",
          icon: <Sparkles className="w-3 h-3" />,
        }
      case "독점":
        return {
          className: "bg-amber-500 text-white",
          icon: <Zap className="w-3 h-3" />,
        }
      default:
        return { className: "bg-slate-600 text-white", icon: null }
    }
  }

  return (
    <section className="relative px-4 md:px-6 py-8 group/section">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
          <a href="#" className="text-sm text-slate-400 hover:text-[#5eead4] transition">
            전체보기
          </a>
        </div>

        <div className="relative">
          {/* Scroll buttons */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-[#252d3d] flex items-center justify-center rounded-full ring-1 ring-slate-600 opacity-0 group-hover/section:opacity-100 transition-all hidden md:flex hover:bg-[#2d3748]"
            aria-label="왼쪽으로"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-[#252d3d] flex items-center justify-center rounded-full ring-1 ring-slate-600 opacity-0 group-hover/section:opacity-100 transition-all hidden md:flex hover:bg-[#2d3748]"
            aria-label="오른쪽으로"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Cards */}
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {items.map((item) => (
              <Link key={item.id} href={`/view/${item.id}`}>
                <div className="relative flex-shrink-0 w-28 md:w-36 group cursor-pointer">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-700 transition-all duration-300 hover:ring-2 hover:ring-[#5eead4]/50">
                    <img
                      src={item.imageUrl || "https://via.placeholder.com/400x600/222/fff?text=Cover"}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge */}
                    {item.badge && (
                      <div
                        className={cn(
                          "absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1",
                          getBadgeStyle(item.badge).className,
                        )}
                      >
                        {getBadgeStyle(item.badge).icon}
                        {item.badge}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-[#5eead4] transition">
                      {item.title}
                    </h3>
                    {item.author && <p className="text-xs text-slate-500">{item.author}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
