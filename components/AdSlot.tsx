"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  /**
   * 광고 슬롯 ID
   */
  adSlot: string;
  /**
   * 광고 형식 (auto, rectangle, horizontal 등)
   */
  adFormat?: string;
  /**
   * 최소 높이 (px) - CLS 방지를 위해 필수
   */
  minHeight?: number;
  /**
   * 광고 클라이언트 ID (기본값: 환경 변수에서 가져옴)
   */
  adClient?: string;
  /**
   * 추가 클래스명
   */
  className?: string;
  /**
   * 광고가 로드되지 않을 때 표시할 플레이스홀더
   */
  placeholder?: React.ReactNode;
}

/**
 * CLS 방지를 위한 고정 높이 광고 슬롯 컴포넌트
 * 
 * 레이아웃 시프트(CLS)를 방지하기 위해:
 * 1. 최소 높이를 미리 할당
 * 2. 광고 로드 전까지 플레이스홀더 표시
 * 3. 광고 로드 후 자동으로 높이 조정
 */
export function AdSlot({
  adSlot,
  adFormat = "auto",
  minHeight = 250,
  adClient,
  className = "",
  placeholder,
}: AdSlotProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adClientId = adClient || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-XXXXX";

  useEffect(() => {
    // AdSense 스크립트가 로드되었는지 확인
    if (typeof window === "undefined") return;

    // 이미 로드된 경우 스킵
    if ((window as any).adsbygoogle && (window as any).adsbygoogle.loaded) {
      return;
    }

    // AdSense 스크립트 동적 로드
    const loadAdSense = () => {
      try {
        // adsbygoogle 배열 초기화
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        
        // 광고 푸시
        (window as any).adsbygoogle.push({
          google_ad_client: adClientId,
          enable_page_level_ads: false,
        });

        // 광고 로드 완료 감지
        const observer = new MutationObserver(() => {
          if (containerRef.current) {
            const adElement = containerRef.current.querySelector(".adsbygoogle");
            if (adElement && adElement.children.length > 0) {
              setIsLoaded(true);
              observer.disconnect();
            }
          }
        });

        if (containerRef.current) {
          observer.observe(containerRef.current, {
            childList: true,
            subtree: true,
          });
        }

        // 타임아웃 설정 (10초 후 에러 처리)
        setTimeout(() => {
          if (!isLoaded) {
            setHasError(true);
            observer.disconnect();
          }
        }, 10000);
      } catch (error) {
        console.error("AdSense 로드 오류:", error);
        setHasError(true);
      }
    };

    // AdSense 스크립트가 이미 있는지 확인
    if (document.querySelector('script[src*="adsbygoogle.js"]')) {
      loadAdSense();
    } else {
      // 스크립트 동적 로드
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + adClientId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = loadAdSense;
      script.onerror = () => {
        console.error("AdSense 스크립트 로드 실패");
        setHasError(true);
      };
      document.head.appendChild(script);
    }
  }, [adClientId, isLoaded]);

  return (
    <div
      ref={containerRef}
      className={`ad-slot ${className}`}
      style={{
        minHeight: `${minHeight}px`,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: hasError ? "transparent" : "#f3f4f6",
        position: "relative",
      }}
    >
      {/* 광고가 로드되지 않았을 때 플레이스홀더 */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          {placeholder || "광고 로딩 중..."}
        </div>
      )}

      {/* 에러 상태 */}
      {hasError && placeholder && (
        <div className="text-gray-400 text-sm">{placeholder}</div>
      )}

      {/* AdSense 광고 */}
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          minHeight: `${minHeight}px`,
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
        data-ad-client={adClientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * 인라인 광고 슬롯 (작은 크기)
 */
export function InlineAdSlot({
  adSlot,
  className = "",
}: {
  adSlot: string;
  className?: string;
}) {
  return (
    <AdSlot
      adSlot={adSlot}
      adFormat="auto"
      minHeight={100}
      className={className}
      placeholder={
        <div className="text-xs text-gray-500">광고</div>
      }
    />
  );
}

/**
 * 배너 광고 슬롯 (가로형)
 */
export function BannerAdSlot({
  adSlot,
  className = "",
}: {
  adSlot: string;
  className?: string;
}) {
  return (
    <AdSlot
      adSlot={adSlot}
      adFormat="horizontal"
      minHeight={90}
      className={className}
      placeholder={
        <div className="text-xs text-gray-500">광고</div>
      }
    />
  );
}

/**
 * 사각형 광고 슬롯 (중간 크기)
 */
export function RectangleAdSlot({
  adSlot,
  className = "",
}: {
  adSlot: string;
  className?: string;
}) {
  return (
    <AdSlot
      adSlot={adSlot}
      adFormat="rectangle"
      minHeight={250}
      className={className}
      placeholder={
        <div className="text-xs text-gray-500">광고</div>
      }
    />
  );
}
