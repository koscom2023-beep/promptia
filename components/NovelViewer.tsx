"use client"

import { useEffect, useState } from "react"

interface NovelViewerProps {
  content: string
  episodeId: string
  novelId: string
}

// 폰트 설정 타입
type FontFamily = "noto-sans" | "nanum-gothic" | "nanum-myeongjo" | "pretendard"
type FontSize = "small" | "medium" | "large" | "xlarge"
type LineHeight = "tight" | "normal" | "relaxed"

export function NovelViewer({ content, episodeId, novelId }: NovelViewerProps) {
  // 폰트 설정 상태 (localStorage에서 불러오기)
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novel-viewer-font-${novelId}`)
      return (saved as FontFamily) || "noto-sans"
    }
    return "noto-sans"
  })

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novel-viewer-size-${novelId}`)
      return (saved as FontSize) || "medium"
    }
    return "medium"
  })

  const [lineHeight, setLineHeight] = useState<LineHeight>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novel-viewer-line-${novelId}`)
      return (saved as LineHeight) || "relaxed"
    }
    return "relaxed"
  })

  // 스크롤 위치 저장 및 복원
  useEffect(() => {
    // 저장된 스크롤 위치 복원
    const scrollKey = `novel-scroll-${novelId}-${episodeId}`
    const savedScroll = sessionStorage.getItem(scrollKey)
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll, 10))
    }

    // 스크롤 이벤트 리스너 (스크롤 위치 저장)
    const handleScroll = () => {
      sessionStorage.setItem(scrollKey, window.scrollY.toString())
    }

    // 디바운스된 스크롤 핸들러
    let scrollTimeout: NodeJS.Timeout
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(handleScroll, 100)
    }

    window.addEventListener("scroll", debouncedScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", debouncedScroll)
      clearTimeout(scrollTimeout)
    }
  }, [novelId, episodeId])

  // 폰트 설정 저장
  useEffect(() => {
    localStorage.setItem(`novel-viewer-font-${novelId}`, fontFamily)
  }, [fontFamily, novelId])

  useEffect(() => {
    localStorage.setItem(`novel-viewer-size-${novelId}`, fontSize)
  }, [fontSize, novelId])

  useEffect(() => {
    localStorage.setItem(`novel-viewer-line-${novelId}`, lineHeight)
  }, [lineHeight, novelId])

  // 폰트 클래스 매핑
  const fontFamilyClasses = {
    "noto-sans": "font-sans",
    "nanum-gothic": "font-[NanumGothic]",
    "nanum-myeongjo": "font-[NanumMyeongjo]",
    "pretendard": "font-[Pretendard]",
  }

  const fontSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
    xlarge: "text-xl",
  }

  const lineHeightClasses = {
    tight: "leading-tight",
    normal: "leading-normal",
    relaxed: "leading-relaxed",
  }

  return (
    <div className="relative">
      {/* 설정 패널 (고정) */}
      <div className="sticky top-4 z-10 mb-4 flex justify-end">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            {/* 폰트 선택 */}
            <label className="flex items-center gap-2">
              <span className="text-gray-600">폰트:</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="noto-sans">본고딕</option>
                <option value="nanum-gothic">나눔고딕</option>
                <option value="nanum-myeongjo">나눔명조</option>
                <option value="pretendard">프리텐다드</option>
              </select>
            </label>

            {/* 크기 선택 */}
            <label className="flex items-center gap-2">
              <span className="text-gray-600">크기:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as FontSize)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="small">작게</option>
                <option value="medium">보통</option>
                <option value="large">크게</option>
                <option value="xlarge">아주 크게</option>
              </select>
            </label>

            {/* 줄간격 선택 */}
            <label className="flex items-center gap-2">
              <span className="text-gray-600">줄간격:</span>
              <select
                value={lineHeight}
                onChange={(e) => setLineHeight(e.target.value as LineHeight)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="tight">좁게</option>
                <option value="normal">보통</option>
                <option value="relaxed">넓게</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* 본문 내용 */}
      <div
        className={`p-8 prose max-w-none ${fontFamilyClasses[fontFamily]} ${fontSizeClasses[fontSize]} ${lineHeightClasses[lineHeight]}`}
      >
        <div className="whitespace-pre-wrap text-gray-900">
          {content}
        </div>
      </div>
    </div>
  )
}
