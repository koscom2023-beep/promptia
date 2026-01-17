"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { r2ImageLoader } from "@/lib/image-loader";
import { ImageSkeleton } from "./ImageSkeleton";

interface WebtoonViewerProps {
  imageUrls: string[];
}

export function WebtoonViewer({ imageUrls }: WebtoonViewerProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [, setVisibleRange] = useState({ start: 0, end: Math.min(5, imageUrls.length) });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection Observer로 이미지 로드 (Lazy Loading)
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0", 10);
            setLoadedImages((prev) => new Set([...Array.from(prev), index]));
          }
        });
      },
      {
        rootMargin: "200px", // 뷰포트 200px 전에 미리 로드
        threshold: 0.1,
      }
    );

    // 초기 5개 이미지는 즉시 로드
    const initialSet = new Set<number>();
    for (let i = 0; i < Math.min(5, imageUrls.length); i++) {
      initialSet.add(i);
    }
    setLoadedImages(initialSet);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [imageUrls.length]);

  // 이미지 요소 관찰 시작
  useEffect(() => {
    imageRefs.current.forEach((ref, index) => {
      if (ref && observerRef.current && !loadedImages.has(index)) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        imageRefs.current.forEach((ref) => {
          if (ref) {
            observerRef.current?.unobserve(ref);
          }
        });
      }
    };
  }, [imageUrls.length, loadedImages]);

  // 이미지 로드 핸들러
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set([...prev, index]));
  }, []);

  // 이미지 에러 핸들러
  const handleImageError = useCallback((index: number) => {
    console.warn(`이미지 로드 실패: ${imageUrls[index]}`);
    // 에러 발생 시에도 로드된 것으로 표시 (스켈레톤 제거)
    setLoadedImages((prev) => new Set([...prev, index]));
  }, [imageUrls]);

  return (
    <div className="w-full bg-netflix-black">
      {/* 여백 없는 세로 무한 스크롤 레이아웃 */}
      <div className="flex flex-col items-center">
        {imageUrls.map((url, index) => {
          const isLoaded = loadedImages.has(index);
          const optimizedUrl = r2ImageLoader({ src: url, width: 800, quality: 85 });

          return (
            <div
              key={index}
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              data-index={index}
              className="w-full relative"
              style={{
                minHeight: isLoaded ? "auto" : "600px", // 로드 전 최소 높이
              }}
            >
              {isLoaded ? (
                <Image
                  src={optimizedUrl}
                  alt={`웹툰 이미지 ${index + 1}`}
                  width={800}
                  height={1200}
                  className="w-full h-auto"
                  unoptimized
                  loader={r2ImageLoader}
                  priority={index < 3} // 처음 3개는 우선 로드
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                />
              ) : (
                <ImageSkeleton className="w-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* 로딩 완료 표시 */}
      {loadedImages.size === imageUrls.length && imageUrls.length > 0 && (
        <div className="text-center py-8 text-foreground-muted text-sm">
          모든 이미지를 불러왔습니다
        </div>
      )}
    </div>
  );
}
