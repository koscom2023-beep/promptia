import { Metadata } from "next";
// import { generateWebtoonMetadata, generateWebtoonJsonLd } from "@/lib/seo";
// import { Webtoon } from "@/types/content";
import { ImageSkeleton } from "@/components/ImageSkeleton";

// TODO: 실제 데이터를 가져오는 함수로 교체하세요
interface Webtoon {
  id: string;
  title: string;
  author: string;
  description?: string;
  thumbnail?: string;
}

async function getWebtoon(id: string): Promise<Webtoon | null> {
  // 예시: API나 데이터베이스에서 웹툰 데이터 가져오기
  // const response = await fetch(`${process.env.API_URL}/webtoons/${id}`);
  // return response.json();
  
  // 임시 데이터 (실제 구현 시 제거)
  return null;
}

/**
 * 동적 메타데이터 생성
 * Next.js가 자동으로 이 함수를 호출하여 SEO 메타데이터를 생성합니다.
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const webtoon = await getWebtoon(params.id);

  if (!webtoon) {
    return {
      title: "웹툰을 찾을 수 없습니다",
      description: "요청하신 웹툰을 찾을 수 없습니다.",
    };
  }

  // return generateWebtoonMetadata(webtoon);
  return {
    title: webtoon.title,
    description: webtoon.description || "웹툰 작품",
  };
}

/**
 * 웹툰 상세 페이지 컴포넌트
 */
export default async function WebtoonPage({
  params,
}: {
  params: { id: string };
}) {
  const webtoon = await getWebtoon(params.id);

  if (!webtoon) {
    return <div>웹툰을 찾을 수 없습니다.</div>;
  }

  // JSON-LD 구조화된 데이터 생성
  // const jsonLd = generateWebtoonJsonLd(webtoon);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicSeries",
    name: webtoon.title,
    author: webtoon.author,
  };

  return (
    <>
      {/* JSON-LD 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* 페이지 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">{webtoon.title}</h1>
        <p className="text-xl text-gray-600 mb-4">작가: {webtoon.author}</p>
        {webtoon.thumbnail && (
          <div className="w-full max-w-2xl mb-6">
            <ImageSkeleton
              src={webtoon.thumbnail}
              alt={webtoon.title}
              width={800}
              height={600}
              className="w-full rounded-lg"
              objectFit="cover"
            />
          </div>
        )}
        {webtoon.description && (
          <p className="text-lg">{webtoon.description}</p>
        )}
        {/* 여기에 웹툰 에피소드 등 추가 컨텐츠 */}
      </div>
    </>
  );
}
