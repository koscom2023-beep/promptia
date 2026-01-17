/**
 * Cloudflare Image Resizing API를 사용하는 커스텀 이미지 로더
 * 
 * Cloudflare Transform Rules 또는 Workers를 통해 이미지 리사이징을 처리합니다.
 * R2 Public URL에 이미지 변환 파라미터를 추가하여 최적화된 이미지를 제공합니다.
 */

/**
 * Cloudflare 이미지 리사이징 URL 생성
 * 
 * @param src - 원본 이미지 URL
 * @param width - 원하는 너비 (픽셀)
 * @param quality - 이미지 품질 (1-100, 기본값: 80)
 * @param format - 이미지 포맷 ('auto', 'webp', 'jpeg', 'png', 기본값: 'auto')
 * @returns 최적화된 이미지 URL
 */
export function cloudflareImageLoader({
  src,
  width,
  quality = 80,
  format = "auto",
}: {
  src: string;
  width: number;
  quality?: number;
  format?: "auto" | "webp" | "jpeg" | "png" | "avif";
}): string {
  // R2 Public URL인 경우 Cloudflare Transform Rules 사용
  // 형식: https://pub-xxxxx.r2.dev/path/to/image.jpg
  if (src.includes(".r2.dev") || src.includes(".r2.cloudflarestorage.com")) {
    // Cloudflare Transform Rules를 사용하는 경우
    // URL에 이미지 변환 파라미터 추가
    // 참고: Cloudflare Transform Rules는 Workers를 통해 설정해야 합니다
    // 여기서는 기본 URL을 반환하고, 실제 변환은 Cloudflare Workers에서 처리됩니다
    
    // 또는 Cloudflare Images API를 사용하는 경우:
    // const imagesUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL;
    // if (imagesUrl) {
    //   return `${imagesUrl}/${src}?width=${width}&quality=${quality}&format=${format}`;
    // }
    
    // 현재는 원본 URL 반환 (Cloudflare Transform Rules가 자동으로 처리)
    // 또는 수동으로 파라미터 추가 (Workers가 설정된 경우)
    const url = new URL(src);
    url.searchParams.set("width", width.toString());
    url.searchParams.set("quality", quality.toString());
    url.searchParams.set("format", format);
    return url.toString();
  }

  // 다른 URL의 경우 원본 반환 (또는 다른 CDN 서비스 사용)
  return src;
}

/**
 * OG 이미지용 Cloudflare 로더
 * 1200x630 사이즈로 최적화
 */
export function cloudflareOGImageLoader(src: string): string {
  return cloudflareImageLoader({
    src,
    width: 1200,
    quality: 90,
    format: "auto",
  });
}

/**
 * 썸네일용 Cloudflare 로더
 * 작은 크기로 최적화
 */
export function cloudflareThumbnailLoader(src: string, width: number = 400): string {
  return cloudflareImageLoader({
    src,
    width,
    quality: 75,
    format: "auto",
  });
}

/**
 * 이미지 URL이 Cloudflare R2인지 확인
 */
export function isCloudflareR2Url(url: string): boolean {
  return url.includes(".r2.dev") || url.includes(".r2.cloudflarestorage.com");
}

/**
 * Cloudflare 이미지 최적화 URL 생성 (간단 버전)
 * 
 * @param imageUrl - 원본 이미지 URL
 * @param options - 최적화 옵션
 * @returns 최적화된 이미지 URL
 */
export function getOptimizedCloudflareImage(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpeg" | "png" | "avif";
  } = {}
): string {
  const { width, height, quality = 80, format = "auto" } = options;

  if (!isCloudflareR2Url(imageUrl)) {
    return imageUrl;
  }

  const url = new URL(imageUrl);
  
  if (width) {
    url.searchParams.set("width", width.toString());
  }
  
  if (height) {
    url.searchParams.set("height", height.toString());
  }
  
  url.searchParams.set("quality", quality.toString());
  url.searchParams.set("format", format);

  return url.toString();
}
