import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { cloudflareOGImageLoader } from "@/lib/cloudflare-loader";

export const runtime = "edge";

/**
 * 동적 OG 이미지 생성 API
 * 
 * 쿼리 파라미터:
 * - title: 작품 제목 (필수)
 * - author: 작가 이름 (선택)
 * - imageUrl: 썸네일 이미지 URL (선택)
 * - type: 작품 유형 ('novel', 'webtoon', 'video', 선택)
 * 
 * 예시:
 * /api/og?title=재벌집%20막내%20AI&author=프롬프티아&imageUrl=https://...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 추출
    const title = searchParams.get("title") || "프롬프티아";
    const author = searchParams.get("author") || "프롬프티아 작가";
    const imageUrl = searchParams.get("imageUrl");
    const type = searchParams.get("type") || "novel";
    const ranking = searchParams.get("ranking"); // 실시간 랭킹 순위
    const voteCount = searchParams.get("voteCount"); // 득표수
    const viewCount = searchParams.get("viewCount"); // 조회수

    // 이미지 URL 최적화 (Cloudflare 로더 사용)
    const optimizedImageUrl = imageUrl
      ? cloudflareOGImageLoader(imageUrl)
      : null;

    // 작품 유형별 아이콘 및 색상
    const typeConfig = {
      novel: {
        label: "소설",
        color: "#5eead4",
        bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      webtoon: {
        label: "웹툰",
        color: "#fbbf24",
        bgGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      video: {
        label: "영상",
        color: "#ef4444",
        bgGradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.novel;

    // 폰트 로드 (Noto Sans KR)
    // 참고: 실제 배포 시 폰트 파일을 CDN에서 로드하거나 base64로 임베드해야 합니다
    // 여기서는 시스템 폰트 사용

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: config.bgGradient,
            position: "relative",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* 배경 이미지 (있는 경우) */}
          {optimizedImageUrl && (
            <img
              src={optimizedImageUrl}
              alt=""
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.3,
                filter: "blur(20px)",
              }}
            />
          )}

          {/* 메인 콘텐츠 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "80px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* 작품 유형 배지 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                borderRadius: "8px",
                marginBottom: "40px",
                fontSize: "24px",
                fontWeight: "bold",
                color: config.color,
                backdropFilter: "blur(10px)",
              }}
            >
              {config.label}
            </div>

            {/* 제목 */}
            <h1
              style={{
                fontSize: "72px",
                fontWeight: "900",
                color: "#ffffff",
                textAlign: "center",
                marginBottom: "30px",
                lineHeight: "1.2",
                textShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                maxWidth: "1000px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </h1>

            {/* 작가 정보 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "32px",
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "20px",
              }}
            >
              <span>작가:</span>
              <span style={{ fontWeight: "bold" }}>{author}</span>
            </div>

            {/* 실시간 통계 (랭킹, 득표수, 조회수) */}
            {(ranking || voteCount || viewCount) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "40px",
                  fontSize: "28px",
                  color: "rgba(255, 255, 255, 0.95)",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  padding: "20px 40px",
                  borderRadius: "12px",
                  marginBottom: "40px",
                }}
              >
                {ranking && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: config.color, fontWeight: "bold", fontSize: "36px" }}>
                      #{ranking}
                    </span>
                    <span style={{ fontSize: "24px", color: "rgba(255, 255, 255, 0.7)" }}>
                      실시간 랭킹
                    </span>
                  </div>
                )}
                {voteCount && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: "bold" }}>👍 {voteCount}</span>
                  </div>
                )}
                {viewCount && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: "bold" }}>👁️ {viewCount}</span>
                  </div>
                )}
              </div>
            )}

            {/* 프롬프티아 로고/브랜딩 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "28px",
                color: "rgba(255, 255, 255, 0.8)",
                marginTop: "auto",
              }}
            >
              <span>프롬프티아</span>
              <span style={{ fontSize: "20px" }}>•</span>
              <span>AI 창작 서바이벌</span>
            </div>
          </div>

          {/* 법규 준수: AI Generated 문구 (우측 하단, 0.3 투명도) */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "40px",
              fontSize: "20px",
              color: "rgba(255, 255, 255, 0.3)",
              fontWeight: "500",
              zIndex: 2,
            }}
          >
            AI Generated by Promptia
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error("OG 이미지 생성 실패:", error);
    
    // 에러 발생 시 기본 이미지 반환
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#ffffff",
            fontSize: "48px",
            fontWeight: "bold",
          }}
        >
          프롬프티아
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
