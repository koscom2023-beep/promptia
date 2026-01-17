interface ImageSkeletonProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

export function ImageSkeleton({
  src,
  alt,
  width,
  height,
  className = "",
  objectFit = "cover",
}: ImageSkeletonProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-${objectFit} animate-shimmer`}
        loading="lazy"
      />
    </div>
  );
}
