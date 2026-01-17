"use client"

import { getOptimizedImageUrl } from "@/lib/image-loader"

interface WebtoonViewerProps {
  imageUrls: string[];
}

export function WebtoonViewer({ imageUrls }: WebtoonViewerProps) {
  return (
    <div className="p-4">
      <div className="space-y-4">
        {imageUrls.map((url, index) => {
          // R2 CDN URL을 우선 사용하여 Vercel 서버를 거치지 않음
          const optimizedUrl = getOptimizedImageUrl(url);
          
          return (
            <img
              key={index}
              src={optimizedUrl}
              alt={`웹툰 이미지 ${index + 1}`}
              className="w-full h-auto rounded-lg"
              loading="lazy"
              // unoptimized로 설정하여 Vercel 이미지 최적화 비용 절감
              style={{ imageRendering: "auto" }}
            />
          );
        })}
      </div>
    </div>
  );
}
