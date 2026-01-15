import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: {
    id: string;
  };
}

// 동적 메타데이터 생성
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = await createClient();

  const { data: novel } = await supabase
    .from("novels")
    .select("id, title, description, category, cover_image_url")
    .eq("id", params.id)
    .single();

  if (!novel) {
    return {
      title: "작품을 찾을 수 없습니다",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  const title = novel.title;
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

export default async function NovelPage({ params }: PageProps) {
  const supabase = await createClient();

  // 첫 번째 에피소드 찾기
  const { data: episode, error } = await supabase
    .from("episodes")
    .select("id")
    .eq("novel_id", params.id)
    .order("episode_number", { ascending: true })
    .limit(1)
    .single();

  if (error || !episode) {
    notFound();
  }

  // 첫 번째 에피소드로 리다이렉트
  redirect(`/novels/${params.id}/${episode.id}`);
}
