"use client";

import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface VideoViewerProps {
  youtubeUrl: string;
  thumbnailUrl?: string;
  title?: string;
}

/**
 * YouTube URL에서 비디오 ID 추출
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * YouTube 썸네일 URL 생성
 */
function getYouTubeThumbnail(videoId: string, quality: "default" | "medium" | "high" | "maxres" = "maxres"): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * YouTube 임베드 URL 생성
 */
function getYouTubeEmbedUrl(videoId: string, autoplay: boolean = true): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`;
}

export function VideoViewer({ youtubeUrl, thumbnailUrl, title }: VideoViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  // YouTube URL에서 비디오 ID 추출
  useEffect(() => {
    const id = extractYouTubeId(youtubeUrl);
    setVideoId(id);
  }, [youtubeUrl]);

  // 썸네일 URL 결정 (Facade 패턴)
  const getThumbnailUrl = (): string => {
    if (thumbnailUrl) {
      return thumbnailUrl;
    }
    if (videoId) {
      return getYouTubeThumbnail(videoId, "maxres");
    }
    return "https://via.placeholder.com/1280x720/000000/FFFFFF?text=Video+Thumbnail";
  };

  // 재생 버튼 클릭 핸들러
  const handlePlay = () => {
    setIsLoading(true);
    setIsPlaying(true);
    // 약간의 지연 후 로딩 완료 (실제로는 iframe 로드 완료 이벤트 사용)
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-netflix-dark flex items-center justify-center">
        <p className="text-foreground-muted">유효하지 않은 YouTube URL입니다.</p>
      </div>
    );
  }

  const thumbnail = getThumbnailUrl();
  const embedUrl = getYouTubeEmbedUrl(videoId, true);

  return (
    <div className="w-full relative bg-netflix-black">
      <div className="relative aspect-video w-full bg-netflix-dark">
        {!isPlaying ? (
          // Facade: 썸네일 먼저 표시 (초기 성능 최적화)
          <div className="relative w-full h-full group cursor-pointer" onClick={handlePlay}>
            {/* 썸네일 이미지 */}
            <Image
              src={thumbnail}
              alt={title || "비디오 썸네일"}
              fill
              className="object-cover"
              unoptimized
              priority
            />

            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-netflix-black/80 via-transparent to-transparent" />

            {/* 재생 버튼 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-netflix-red rounded-full animate-ping opacity-75" />
                <button
                  className="relative w-20 h-20 bg-netflix-red rounded-full flex items-center justify-center shadow-2xl hover:bg-netflix-red-hover transition-all transform hover:scale-110"
                  aria-label="재생"
                >
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </button>
              </div>
            </div>

            {/* 제목 (있는 경우) */}
            {title && (
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-2xl font-bold text-white text-shadow-netflix">{title}</h2>
              </div>
            )}
          </div>
        ) : (
          // 실제 YouTube 임베드 (재생 시작 후)
          <div className="relative w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-netflix-dark z-10">
                <Loader2 className="w-12 h-12 text-netflix-red animate-spin" />
              </div>
            )}
            <iframe
              src={embedUrl}
              className={cn(
                "w-full h-full",
                isLoading && "opacity-0"
              )}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title || "YouTube 비디오"}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
