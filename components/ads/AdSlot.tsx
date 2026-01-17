"use client";

import { useEffect, useState, useRef } from "react";

interface AdSlotProps {
  /**
   * 광고 슬롯 ID (Google AdSense에서 생성)
   * 예: "1234567890"
   */
  slotId: string;
  
  /**
   * 광고 형식
   * - display: 디스플레이 광고 (기본)
   * - in-article: 본문 내 광고
   * - feed: 피드형 광고
   */
  format?: "display" | "in-article" | "feed";
  
  /**
   * 광고 레이아웃
   * - fixed: 고정 크기
   * - responsive: 반응형 (기본)
   */
  layout?: "fixed" | "responsive";
  
  /**
   * 광고 스타일 (커스텀 CSS 클래스)
   */
  className?: string;
  
  /**
   * 광고가 로드되기 전 스켈레톤 높이
   */
  placeholderHeight?: number;
}

/**
 * Google AdSense 광고 슬롯 컴포넌트
 * 
 * 특징:
 * - 광고 로딩 중 스켈레톤 UI 표시 (레이아웃 시프트 방지)
 * - 광고 로드 실패 시 우아한 처리
 * - 반응형 디자인 지원
 */
export function AdSlot({
  slotId,
  format = "display",
  layout = "responsive",
  className = "",
  placeholderHeight = 250,
}: AdSlotProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // AdSense 스크립트가 로드되었는지 확인
    if (typeof window !== "undefined" && (window as any).adsbygoogle) {
      try {
        // 광고 푸시
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        
        // 로딩 완료 표시 (1초 후)
        const timer = setTimeout(() => {
          setIsLoaded(true);
        }, 1000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("AdSense 광고 로드 오류:", error);
        setHasError(true);
        setIsLoaded(true);
      }
    } else {
      // AdSense 스크립트가 없으면 3초 후 스켈레톤 제거
      const timer = setTimeout(() => {
        setHasError(true);
        setIsLoaded(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // 광고 로드 실패 시 빈 공간 표시
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900/30 rounded-lg border border-gray-800 ${className}`}
        style={{ minHeight: `${placeholderHeight}px` }}
      >
        <p className="text-sm text-gray-500">광고 영역</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 스켈레톤 UI (로딩 중) */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse rounded-lg"
          style={{ height: `${placeholderHeight}px` }}
        >
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-500">광고 로딩 중...</span>
          </div>
        </div>
      )}

      {/* 실제 광고 */}
      <div
        ref={adRef}
        className={`${!isLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
        style={{ minHeight: `${placeholderHeight}px` }}
      >
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            minHeight: `${placeholderHeight}px`,
          }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-0000000000000000"}
          data-ad-slot={slotId}
          data-ad-format={format === "display" ? "auto" : format}
          data-ad-layout={layout === "responsive" ? undefined : "fixed"}
          data-full-width-responsive={layout === "responsive" ? "true" : "false"}
        />
      </div>
    </div>
  );
}

/**
 * 본문 내 광고 (In-Article Ad)
 * 
 * 소설이나 웹툰 본문 중간에 자연스럽게 배치되는 광고
 */
export function InArticleAd({ slotId }: { slotId: string }) {
  return (
    <div className="my-8 mx-auto max-w-3xl">
      <div className="text-xs text-gray-500 text-center mb-2">Advertisement</div>
      <AdSlot
        slotId={slotId}
        format="in-article"
        placeholderHeight={200}
        className="bg-gray-900/20 rounded-lg p-4"
      />
    </div>
  );
}

/**
 * 피드형 광고 (Feed Ad)
 * 
 * 랭킹 리스트나 작품 목록 사이에 배치되는 광고
 */
export function FeedAd({ slotId }: { slotId: string }) {
  return (
    <div className="my-6">
      <div className="text-xs text-gray-500 text-center mb-2">Sponsored</div>
      <AdSlot
        slotId={slotId}
        format="feed"
        placeholderHeight={280}
        className="bg-gray-900/20 rounded-lg"
      />
    </div>
  );
}
