/**
 * 워터마크 유틸리티 함수
 * Canvas API를 사용하여 이미지에 워터마크를 추가합니다.
 */

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  position?: 'bottom-right' | 'center' | 'grid';
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

/**
 * 이미지 URL을 받아 워터마크가 적용된 Blob URL을 반환합니다.
 */
export async function addWatermark(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    text = 'Promptia AI',
    opacity = 0.3,
    position = 'bottom-right',
    fontSize = 24,
    fontFamily = 'Arial, sans-serif',
    color = 'white',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // 원본 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 워터마크 스타일 설정
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (position === 'center') {
        // 중앙에 격자무늬 워터마크
        const textWidth = ctx.measureText(text).width;
        const spacing = Math.max(textWidth, 200);
        
        // 격자무늬 패턴
        for (let x = spacing / 2; x < canvas.width; x += spacing) {
          for (let y = spacing / 2; y < canvas.height; y += spacing) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 4); // 45도 회전
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else if (position === 'grid') {
        // 더 촘촘한 격자무늬
        const textWidth = ctx.measureText(text).width;
        const spacing = Math.max(textWidth * 1.5, 150);
        
        for (let x = spacing / 2; x < canvas.width; x += spacing) {
          for (let y = spacing / 2; y < canvas.height; y += spacing) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 6); // 30도 회전
            ctx.globalAlpha = opacity * 0.7; // 더 연하게
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else {
        // 우측 하단 (기본)
        const padding = 20;
        const x = canvas.width - padding;
        const y = canvas.height - padding;
        
        // 그림자 효과
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, x, y);
      }

      // Blob URL 생성
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('워터마크 적용 실패'));
          }
        },
        'image/png',
        0.95
      );
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    img.src = imageUrl;
  });
}

/**
 * 여러 이미지 URL에 일괄 워터마크 적용
 */
export async function addWatermarkToMultiple(
  imageUrls: string[],
  options: WatermarkOptions = {}
): Promise<string[]> {
  const promises = imageUrls.map((url) => addWatermark(url, options));
  return Promise.all(promises);
}
