"use client";

import { useEffect, useState, useRef } from "react";
import { Settings, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovelViewerProps {
  content: string;
  episodeId: string;
  novelId: string;
}

// 폰트 설정 타입
type FontFamily = "noto-sans" | "nanum-gothic" | "nanum-myeongjo" | "pretendard";
type FontSize = "small" | "medium" | "large" | "xlarge";
type LineHeight = "tight" | "normal" | "relaxed";

// 폰트 크기 매핑 (px 단위)
const fontSizeMap: Record<FontSize, string> = {
  small: "16px",
  medium: "18px",
  large: "20px",
  xlarge: "24px",
};

// 줄간격 매핑
const lineHeightMap: Record<LineHeight, string> = {
  tight: "1.5",
  normal: "1.8",
  relaxed: "2.2",
};

export function NovelViewer({ content, episodeId, novelId }: NovelViewerProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 폰트 설정 상태 (localStorage에서 불러오기)
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novel-viewer-font-${novelId}`);
      return (saved as FontFamily) || "noto-sans";
    }
    return "noto-sans";
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novel-viewer-size-${novelId}`);
      return (saved as FontSize) || "medium";
    }
    return "medium";
  });

  const [lineHeight, setLineHeight] = useState<LineHeight>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novel-viewer-line-${novelId}`);
      return (saved as LineHeight) || "relaxed";
    }
    return "relaxed";
  });

  // 스크롤 위치 저장 및 복원
  useEffect(() => {
    const scrollKey = `novel-scroll-${novelId}-${episodeId}`;
    
    // 저장된 스크롤 위치 복원
    const savedScroll = sessionStorage.getItem(scrollKey);
    if (savedScroll && contentRef.current) {
      // 약간의 지연 후 스크롤 (렌더링 완료 후)
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }, 100);
    }

    // 스크롤 이벤트 리스너 (디바운스)
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sessionStorage.setItem(scrollKey, window.scrollY.toString());
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [novelId, episodeId]);

  // 폰트 설정 저장
  useEffect(() => {
    localStorage.setItem(`novel-viewer-font-${novelId}`, fontFamily);
  }, [fontFamily, novelId]);

  useEffect(() => {
    localStorage.setItem(`novel-viewer-size-${novelId}`, fontSize);
  }, [fontSize, novelId]);

  useEffect(() => {
    localStorage.setItem(`novel-viewer-line-${novelId}`, lineHeight);
  }, [lineHeight, novelId]);

  // 폰트 크기 증가/감소
  const increaseFontSize = () => {
    const sizes: FontSize[] = ["small", "medium", "large", "xlarge"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes: FontSize[] = ["small", "medium", "large", "xlarge"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  // 폰트 클래스 매핑
  const fontFamilyClasses = {
    "noto-sans": "font-sans",
    "nanum-gothic": "font-[NanumGothic]",
    "nanum-myeongjo": "font-[NanumMyeongjo]",
    "pretendard": "font-[Pretendard]",
  };

  return (
    <div className="relative min-h-screen bg-netflix-black">
      {/* 설정 버튼 (고정) */}
      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="fixed top-20 right-4 z-50 p-3 bg-netflix-dark/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-netflix-dark transition-colors"
        aria-label="설정 열기"
      >
        <Settings className="w-5 h-5 text-foreground" />
      </button>

      {/* 설정 패널 (슬라이드) */}
      <div
        className={cn(
          "fixed top-20 right-4 z-40 bg-netflix-dark/95 backdrop-blur-sm rounded-lg shadow-xl border border-netflix-dark-tertiary p-4 transition-all duration-300",
          isSettingsOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        )}
      >
        <div className="space-y-4 min-w-[280px]">
          <h3 className="text-sm font-semibold text-foreground mb-3">읽기 설정</h3>

          {/* 폰트 선택 */}
          <div>
            <label className="block text-xs text-foreground-muted mb-2">폰트</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as FontFamily)}
              className="w-full px-3 py-2 bg-netflix-dark-secondary border border-netflix-dark-tertiary rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-netflix-red"
            >
              <option value="noto-sans">본고딕</option>
              <option value="nanum-gothic">나눔고딕</option>
              <option value="nanum-myeongjo">나눔명조</option>
              <option value="pretendard">프리텐다드</option>
            </select>
          </div>

          {/* 폰트 크기 조절 */}
          <div>
            <label className="block text-xs text-foreground-muted mb-2">크기</label>
            <div className="flex items-center gap-3">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize === "small"}
                className="p-2 bg-netflix-dark-secondary hover:bg-netflix-dark-tertiary rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="폰트 크기 감소"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              <span className="flex-1 text-center text-sm text-foreground">
                {fontSize === "small" && "작게"}
                {fontSize === "medium" && "보통"}
                {fontSize === "large" && "크게"}
                {fontSize === "xlarge" && "아주 크게"}
              </span>
              <button
                onClick={increaseFontSize}
                disabled={fontSize === "xlarge"}
                className="p-2 bg-netflix-dark-secondary hover:bg-netflix-dark-tertiary rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="폰트 크기 증가"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* 줄간격 선택 */}
          <div>
            <label className="block text-xs text-foreground-muted mb-2">줄간격</label>
            <select
              value={lineHeight}
              onChange={(e) => setLineHeight(e.target.value as LineHeight)}
              className="w-full px-3 py-2 bg-netflix-dark-secondary border border-netflix-dark-tertiary rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-netflix-red"
            >
              <option value="tight">좁게</option>
              <option value="normal">보통</option>
              <option value="relaxed">넓게</option>
            </select>
          </div>
        </div>
      </div>

      {/* 본문 내용 (가독성 높은 레이아웃) */}
      <div
        ref={contentRef}
        className={cn(
          "max-w-4xl mx-auto px-4 py-12",
          fontFamilyClasses[fontFamily]
        )}
        style={{
          fontSize: fontSizeMap[fontSize],
          lineHeight: lineHeightMap[lineHeight],
          color: "#ffffff",
        }}
      >
        <div className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed">
            {content.split("\n").map((paragraph, index) => (
              <p
                key={index}
                className="mb-6 text-foreground"
                style={{
                  textAlign: "justify",
                  wordBreak: "keep-all",
                  hyphens: "auto",
                }}
              >
                {paragraph || "\u00A0"} {/* 빈 줄은 non-breaking space로 처리 */}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
