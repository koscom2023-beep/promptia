"use client";

import { useEffect, useState } from "react";
import { addWatermark, type WatermarkOptions } from "@/lib/watermark";

interface WatermarkPreviewProps {
  imageUrl: string;
  watermarkOptions?: WatermarkOptions;
  className?: string;
}

export function WatermarkPreview({
  imageUrl,
  watermarkOptions,
  className = "",
}: WatermarkPreviewProps) {
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setWatermarkedUrl(null);
      return;
    }

    setLoading(true);
    setError(null);

    addWatermark(imageUrl, watermarkOptions)
      .then((url) => {
        setWatermarkedUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error("워터마크 적용 실패:", err);
        setError("워터마크 적용 실패");
        setWatermarkedUrl(imageUrl); // 실패 시 원본 표시
        setLoading(false);
      });

    // Cleanup: 이전 Blob URL 해제
    return () => {
      if (watermarkedUrl && watermarkedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(watermarkedUrl);
      }
    };
  }, [imageUrl, watermarkOptions]);

  if (!imageUrl) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '200px' }}>
        <p className="text-gray-500 text-sm">이미지 URL을 입력하세요</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '200px' }}>
        <p className="text-gray-400 text-sm">워터마크 적용 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <p className="text-red-400 text-sm">{error}</p>
        {watermarkedUrl && (
          <img
            src={watermarkedUrl}
            alt="원본 이미지"
            className="mt-2 w-full h-auto rounded"
          />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={watermarkedUrl || imageUrl}
        alt="워터마크 미리보기"
        className="w-full h-auto rounded-lg border border-gray-700"
      />
      <p className="text-xs text-gray-400 mt-2 text-center">
        ⚠️ 해당 워터마크는 플랫폼 보호를 위해 자동으로 삽입됩니다
      </p>
    </div>
  );
}
