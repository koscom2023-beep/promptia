import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: {
    locale: string;
    id: string;
  };
}

// 동적 메타데이터 생성 (실시간 랭킹 포함 OG 이미지)
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = await createClient();

  const { data: novel } = await supabase
    .from("novels")
    .select("id, title, description, type, thumbnail_url, view_count, vote_count")
    .eq("id", params.id)
    .single();

  if (!novel) {
    return {
      title: "작품을 찾을 수 없습니다",
    };
  }

  // 실시간 랭킹 순위 계산
  const { data: rankings } = await supabase
    .from("novels")
    .select("id, vote_count, view_count, created_at")
    .eq("type", novel.type)
    .order("vote_count", { ascending: false })
    .order("view_count", { ascending: false });

  const rankIndex = rankings?.findIndex((r) => r.id === params.id);
  const ranking = rankIndex !== undefined && rankIndex >= 0 ? rankIndex + 1 : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  const title = novel.title;
  const description =
    novel.description ||
    `${novel.type === "novel" ? "소설" : novel.type === "webtoon" ? "웹툰" : "영상"} 작품을 읽어보세요.`;
  
  // 동적 OG 이미지 URL 생성 (랭킹, 득표수, 조회수 포함)
  const ogImageUrl = new URL(`${siteUrl}/api/og`);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("author", "프롬프티아 작가");
  ogImageUrl.searchParams.set("type", novel.type || "novel");
  if (novel.thumbnail_url) {
    ogImageUrl.searchParams.set("imageUrl", novel.thumbnail_url);
  }
  if (ranking) {
    ogImageUrl.searchParams.set("ranking", ranking.toString());
  }
  if (novel.vote_count) {
    ogImageUrl.searchParams.set("voteCount", novel.vote_count.toString());
  }
  if (novel.view_count) {
    ogImageUrl.searchParams.set("viewCount", novel.view_count.toString());
  }

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${params.locale}/novels/${params.id}`,
      languages: {
        'ko': `${siteUrl}/ko/novels/${params.id}`,
        'en': `${siteUrl}/en/novels/${params.id}`,
        'x-default': `${siteUrl}/ko/novels/${params.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${params.locale}/novels/${params.id}`,
      siteName: params.locale === 'ko' ? '프롬프티아' : 'Promptia',
      locale: params.locale === 'ko' ? 'ko_KR' : 'en_US',
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: novel.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl.toString()],
      creator: "@promptia",
      site: "@promptia",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function NovelPage({ params }: PageProps) {
  const supabase = await createClient();

  // 첫 번째 에피소드 찾기
  const { data: episode, error } = await supabase
    .from("episodes")
    .select("id")
    .eq("novel_id", params.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !episode) {
    // 에피소드가 없으면 404 페이지 표시
    notFound();
  }

  // 첫 번째 에피소드로 리다이렉트
  redirect(`/${params.locale}/novels/${params.id}/${episode.id}`);
}
