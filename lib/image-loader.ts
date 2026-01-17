/**
 * 이미지 로더 유틸리티
 * Vercel 서버를 거치지 않고 R2 CDN URL을 직접 사용
 */

import { isR2Url, getR2PublicUrl } from "./r2";

/**
 * Next.js Image 컴포넌트용 커스텀 로더
 * R2 URL은 Cloudflare 이미지 리사이징 파라미터를 활용하고,
 * 다른 URL은 unoptimized로 처리
 * 
 * 참고: Cloudflare R2 Public URL은 기본적으로 이미지 리사이징을 지원하지 않습니다.
 * Cloudflare Images 서비스를 사용하거나, 별도의 이미지 변환 서비스를 사용해야 합니다.
 * 현재는 R2 Public URL을 그대로 사용하며, unoptimized 속성을 기본으로 합니다.
 */
export function r2ImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // R2 URL인 경우
  if (isR2Url(src)) {
    // Cloudflare Images API를 사용하는 경우 (향후 통합 가능)
    // const imagesUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL;
    // if (imagesUrl && src.includes(imagesUrl)) {
    //   return `${src}?width=${width}&quality=${quality || 75}`;
    // }
    
    // 현재는 R2 Public URL을 그대로 사용 (unoptimized)
    // 브라우저에서 자동으로 최적화하거나, Cloudflare Transform Rules를 사용할 수 있습니다.
    return src;
  }

  // 다른 URL도 unoptimized로 처리 (Vercel 서버를 거치지 않음)
  return src;
}

/**
 * 이미지 URL을 R2 공개 URL로 변환 (필요시)
 * @param url - 원본 이미지 URL
 * @param key - R2에 저장된 파일 키 (선택사항)
 * @returns R2 공개 URL 또는 원본 URL
 */
export function getOptimizedImageUrl(url: string, key?: string): string {
  // 이미 R2 URL이면 그대로 반환
  if (isR2Url(url)) {
    return url;
  }

  // key가 제공되면 R2 공개 URL 생성
  if (key) {
    try {
      return getR2PublicUrl(key);
    } catch (error) {
      console.warn("R2 공개 URL 생성 실패, 원본 URL 사용:", error);
    }
  }

  // 그 외에는 원본 URL 반환 (unoptimized)
  return url;
}

/**
 * 이미지 컴포넌트용 props 생성
 * R2 URL을 우선 사용하고, unoptimized 설정
 */
export function getImageProps(src: string, alt: string, className?: string) {
  const isR2 = isR2Url(src);
  
  return {
    src: isR2 ? src : src,
    alt,
    className,
    // R2 URL이 아니어도 unoptimized로 설정하여 Vercel 서버를 거치지 않음
    unoptimized: true,
    loading: "lazy" as const,
  };
}
