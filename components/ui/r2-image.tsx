/**
 * R2 최적화 이미지 컴포넌트
 * Vercel 서버를 거치지 않고 R2 CDN을 직접 사용
 */

"use client"

import { getOptimizedImageUrl, getImageProps } from "@/lib/image-loader"
import { useState } from "react"

interface R2ImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  onError?: () => void
}

export function R2Image({
  src,
  alt,
  className,
  width,
  height,
  fill,
  priority,
  onError,
}: R2ImageProps) {
  const [imgError, setImgError] = useState(false)
  const optimizedUrl = getOptimizedImageUrl(src)
  const defaultImage = "https://via.placeholder.com/400x600/252d3d/5eead4?text=Image"

  const handleError = () => {
    setImgError(true)
    onError?.()
  }

  // 기본 img 태그 사용 (Next.js Image 컴포넌트 대신)
  // unoptimized로 설정하여 Vercel 서버를 거치지 않음
  if (fill) {
    return (
      <img
        src={imgError ? defaultImage : optimizedUrl}
        alt={alt}
        className={className}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
        loading={priority ? "eager" : "lazy"}
        onError={handleError}
      />
    )
  }

  return (
    <img
      src={imgError ? defaultImage : optimizedUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      onError={handleError}
      style={{ imageRendering: "auto" }}
    />
  )
}
