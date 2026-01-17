"use client";

import Image from "next/image";
import { useState } from "react";

interface SupabaseImageProps {
  /**
   * Supabase Storage 또는 일반 이미지 URL
   */
  src: string;
  
  /**
   * 이미지 alt 텍스트
   */
  alt: string;
  
  /**
   * 이미지 너비
   */
  width?: number;
  
  /**
   * 이미지 높이
   */
  height?: number;
  
  /**
   * CSS 클래스
   */
  className?: string;
  
  /**
   * WebP 변환 여부 (기본: true)
   */
  convertToWebP?: boolean;
  
  /**
   * 이미지 품질 (1-100, 기본: 80)
   */
  quality?: number;
  
  /**
   * 이미지 크기 조정 (픽셀)
   */
  resize?: {
    width?: number;
    height?: number;
  };
}

/**
 * Supabase Image 컴포넌트
 * 
 * 특징:
 * - WebP 포맷 자동 변환
 * - 이미지 최적화 (리사이징, 압축)
 * - Lazy Loading
 * - 에러 처리 (Fallback 이미지)
 */
export function SupabaseImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = "",
  convertToWebP = true,
  quality = 80,
  resize,
}: SupabaseImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // 이미지 URL 최적화
  const optimizedSrc = getOptimizedImageUrl(src, {
    convertToWebP,
    quality,
    resize,
  });

  // Fallback 이미지
  const fallbackSrc = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&q=80";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 로딩 스켈레톤 */}
      {loading && !error && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse"
          style={{ aspectRatio: `${width}/${height}` }}
        />
      )}

      {/* 실제 이미지 */}
      <Image
        src={error ? fallbackSrc : optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-300 ${className}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyYTJhMmEiLz48L3N2Zz4="
      />
    </div>
  );
}

/**
 * 이미지 URL 최적화 함수
 * 
 * Supabase Transform API 또는 Cloudflare Image Resizing 활용
 */
function getOptimizedImageUrl(
  src: string,
  options: {
    convertToWebP?: boolean;
    quality?: number;
    resize?: {
      width?: number;
      height?: number;
    };
  }
): string {
  // Supabase Storage URL인지 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!src.includes(supabaseUrl || "supabase")) {
    // 외부 URL은 그대로 반환
    return src;
  }

  // Supabase Transform API 사용
  // https://supabase.com/docs/guides/storage/serving/image-transformations
  const url = new URL(src);
  const params = new URLSearchParams();

  // WebP 변환
  if (options.convertToWebP) {
    params.set("format", "webp");
  }

  // 품질 설정
  if (options.quality) {
    params.set("quality", options.quality.toString());
  }

  // 리사이징
  if (options.resize?.width) {
    params.set("width", options.resize.width.toString());
  }
  if (options.resize?.height) {
    params.set("height", options.resize.height.toString());
  }

  // 파라미터가 있으면 URL에 추가
  if (params.toString()) {
    url.search = params.toString();
  }

  return url.toString();
}

/**
 * WebP 변환 전용 컴포넌트
 */
export function WebPImage({
  src,
  alt,
  className,
  ...props
}: Omit<SupabaseImageProps, 'convertToWebP'>) {
  return (
    <SupabaseImage
      src={src}
      alt={alt}
      className={className}
      convertToWebP={true}
      {...props}
    />
  );
}
