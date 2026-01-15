import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { NovelViewer } from "@/components/NovelViewer";
import { WebtoonViewer } from "@/components/WebtoonViewer";
import { VoteButton } from "@/components/VoteButton";
import { ReportButton } from "@/components/ReportButton";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { CommentsSection } from "@/components/CommentsSection";
import { getComments } from "@/app/actions/comments";
import { headers } from "next/headers";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";

interface PageProps {
  params: {
    id: string;
    episodeId: string;
  };
}

// 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = await createClient();

  const { data: episode } = await supabase
    .from("episodes")
    .select(
      `
      *,
      novels (
        id,
        title,
        description,
        category,
        cover_image_url
      )
    `
    )
    .eq("id", params.episodeId)
    .single();

  if (!episode) {
    return {
      title: "작품을 찾을 수 없습니다",
    };
  }

  const novel = episode.novels as {
    id: string;
    title: string;
    description: string | null;
    category: "novel" | "webtoon";
    cover_image_url: string | null;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  const title = `${novel.title} - ${episode.title}`;
  const description =
    novel.description ||
    `${novel.category === "novel" ? "소설" : "웹툰"} 작품을 읽어보세요.`;
  const imageUrl =
    novel.cover_image_url ||
    `${siteUrl}/og-image-default.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: novel.title,
        },
      ],
      type: "article",
      siteName: "AI 전용 웹소설/웹툰 공모전 플랫폼",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function EpisodePage({ params }: PageProps) {
  const supabase = await createClient();
  const headersList = await headers();

  // 에피소드 정보 가져오기
  const { data: episode, error: episodeError } = await supabase
    .from("episodes")
    .select(
      `
      *,
      novels (
        id,
        title,
        description,
        category,
        cover_image_url
      )
    `
    )
    .eq("id", params.episodeId)
    .single();

  if (episodeError || !episode) {
    notFound();
  }

  const novel = episode.novels as {
    id: string;
    title: string;
    description: string | null;
    category: "novel" | "webtoon";
    cover_image_url: string | null;
  };

  // 투표 수 가져오기
  const { count: voteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("episode_id", params.episodeId);

  // IP 주소 가져오기 (이미 투표했는지 확인용)
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  // 이미 투표했는지 확인
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("episode_id", params.episodeId)
    .eq("ip_address", ipAddress)
    .single();

  const hasVoted = !!existingVote;

  // 조회수 증가 (에피소드 조회 시)
  await supabase.rpc("increment_novel_view_count", {
    p_novel_id: novel.id,
  });

  // 댓글 목록 가져오기
  const comments = await getComments(params.episodeId);

  // JSON-LD 구조화된 데이터
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": novel.category === "novel" ? "Book" : "ComicSeries",
    name: novel.title,
    description: novel.description || `${novel.title} - ${episode.title}`,
    image: novel.cover_image_url || `${siteUrl}/og-image-default.jpg`,
    author: {
      "@type": "Person",
      name: "익명 작가",
    },
    publisher: {
      "@type": "Organization",
      name: "AI 전용 웹소설/웹툰 공모전 플랫폼",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/novels/${novel.id}/${params.episodeId}`,
    },
    ...(novel.category === "novel" && {
      bookFormat: "EBook",
      inLanguage: "ko",
    }),
    ...(novel.category === "webtoon" && {
      genre: "웹툰",
      inLanguage: "ko",
    }),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 작품 정보 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
          <h2 className="text-xl text-gray-600 mb-4">{episode.title}</h2>
          {novel.description && (
            <p className="text-gray-500 mb-4">{novel.description}</p>
          )}
        </div>

        {/* AdSense 상단 */}
        <div className="mb-6 flex justify-center">
          <AdSenseUnit
            adSlot="상단광고슬롯ID"
            adFormat="auto"
            style={{ minWidth: "320px", minHeight: "100px" }}
            className="w-full"
          />
        </div>

        {/* 뷰어 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {novel.category === "novel" ? (
            <NovelViewer content={episode.content || ""} />
          ) : (
            <WebtoonViewer
              imageUrls={
                Array.isArray(episode.image_urls)
                  ? episode.image_urls
                  : []
              }
            />
          )}
        </div>

        {/* AdSense 댓글창 위 */}
        <div className="mb-6 flex justify-center">
          <AdSenseUnit
            adSlot="댓글창위광고슬롯ID"
            adFormat="auto"
            style={{ minWidth: "320px", minHeight: "100px" }}
            className="w-full"
          />
        </div>

        {/* 투표 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              현재 추천 수: <span className="text-2xl">{voteCount || 0}</span>
            </p>
            <VoteButton
              episodeId={params.episodeId}
              hasVoted={hasVoted}
              voteCount={voteCount || 0}
            />
            <div className="mt-4 flex justify-center">
              <ReportButton novelId={novel.id} episodeId={params.episodeId} />
            </div>
          </div>
        </div>

        {/* AdSense 하단 */}
        <div className="mb-6 flex justify-center">
          <AdSenseUnit
            adSlot="하단광고슬롯ID"
            adFormat="auto"
            style={{ minWidth: "320px", minHeight: "100px" }}
            className="w-full"
          />
        </div>

        {/* 댓글 섹션 */}
        <div className="mb-6">
          <CommentsSection
            episodeId={params.episodeId}
            novelId={novel.id}
            initialComments={comments}
          />
        </div>
      </div>
      </div>
    </>
  );
}
