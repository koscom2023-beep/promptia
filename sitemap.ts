import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

interface NovelItem {
  id: string;
  updated_at?: string;
}

/**
 * 소설 목록 가져오기
 */
async function fetchNovels(): Promise<NovelItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("novels")
      .select("id, updated_at")
      .eq("type", "novel");
    
    return data || [];
  } catch (error) {
    console.error("소설 목록 가져오기 실패:", error);
    return [];
  }
}

/**
 * 웹툰 목록 가져오기
 */
async function fetchWebtoons(): Promise<NovelItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("novels")
      .select("id, updated_at")
      .eq("type", "webtoon");
    
    return data || [];
  } catch (error) {
    console.error("웹툰 목록 가져오기 실패:", error);
    return [];
  }
}

/**
 * 사이트맵 생성 함수
 * Next.js가 자동으로 /sitemap.xml 경로에서 이 함수를 호출합니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 데이터베이스나 API에서 소설 및 웹툰 목록 가져오기
  const [novels, webtoons] = await Promise.all([
    fetchNovels(),
    fetchWebtoons(),
  ]);

  // 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/novels`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/webtoon`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // 소설 상세 페이지들
  const novelPages: MetadataRoute.Sitemap = novels.map((novel) => ({
    url: `${siteUrl}/novels/${novel.id}`,
    lastModified: novel.updated_at ? new Date(novel.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 웹툰 상세 페이지들
  const webtoonPages: MetadataRoute.Sitemap = webtoons.map((webtoon) => ({
    url: `${siteUrl}/novels/${webtoon.id}`,
    lastModified: webtoon.updated_at ? new Date(webtoon.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...novelPages, ...webtoonPages];
}
