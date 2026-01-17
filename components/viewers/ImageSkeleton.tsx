/**
 * 웹툰 뷰어용 이미지 스켈레톤 컴포넌트
 * 로딩 중 플레이스홀더 표시
 */

interface ImageSkeletonProps {
  className?: string;
  width?: number;
  height?: number;
}

export function ImageSkeleton({ className = "", width, height }: ImageSkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-netflix-dark-secondary animate-pulse ${className}`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "600px",
      }}
    >
      {/* 그라데이션 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-netflix-dark-secondary via-netflix-dark-tertiary to-netflix-dark-secondary" />
      
      {/* 로딩 인디케이터 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
