"use client"

import { ArrowRight, Star, Clock, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { useState } from "react"

interface HeroProps {
  title: string
  author?: string
  genres?: string[]
  description: string
  imageUrl: string
  id?: string
}

export function HeroSection({ title, author, genres, description, imageUrl, id }: HeroProps) {
  const [imgError, setImgError] = useState(false)
  // 더 나은 기본 이미지 URL 사용
  const defaultImage = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80"
  
  // imageUrl이 없거나 빈 문자열이면 기본 이미지 사용
  const imageSrc = (!imageUrl || imageUrl.trim() === '' || imgError) 
    ? defaultImage 
    : imageUrl
  
  return (
    <section className="pt-24 pb-8 md:pt-28 md:pb-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-2xl bg-gradient-to-r from-[#252d3d] to-[#1e2433] p-6 md:p-10 overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5eead4]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#a78bfa]/5 rounded-full blur-3xl" />

          <div className="relative grid md:grid-cols-[1fr,200px] lg:grid-cols-[1fr,240px] gap-8 items-center">
            {/* Left: Content */}
            <div className="space-y-5 order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-[#5eead4]/10 text-[#5eead4] px-3 py-1.5 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 fill-current" />
                에디터 추천
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight text-balance">
                {title}
              </h1>

              {(author || genres) && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  {author && <span className="font-medium text-slate-300">{author}</span>}
                  {author && genres && genres.length > 0 && <span className="w-1 h-1 rounded-full bg-slate-600" />}
                  {genres && genres.map((genre, i) => (
                    <span key={genre}>
                      {genre}
                      {i < genres.length - 1 && <span className="ml-3 w-1 h-1 rounded-full bg-slate-600 inline-block" />}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl line-clamp-3">{description}</p>

              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />총 485화
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  매주 월/수/금
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#5eead4]" />
                  9.7
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {id ? (
                  <Link href={`/novels/${id}`}>
                    <Button
                      size="lg"
                      className="bg-[#5eead4] hover:bg-[#2dd4bf] text-[#1e2433] font-semibold px-6 rounded-lg"
                    >
                      첫 화 읽기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/upload">
                    <Button
                      size="lg"
                      className="bg-[#5eead4] hover:bg-[#2dd4bf] text-[#1e2433] font-semibold px-6 rounded-lg"
                    >
                      작품 등록하기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-white/5 hover:text-white px-6 rounded-lg bg-transparent"
                >
                  서재에 담기
                </Button>
              </div>
            </div>

            {/* Right: Book Cover */}
            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <div className="w-36 md:w-full max-w-[200px] lg:max-w-[240px]">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/10 bg-slate-700">
                  <img 
                    src={imageSrc} 
                    alt={title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => {
                      if (!imgError) {
                        setImgError(true)
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
