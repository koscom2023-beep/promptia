import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "가이드 & 공지사항",
  description: "AI 웹소설 작성 가이드와 프롬프티아 공지사항",
};

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, category, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("블로그 포스트 조회 오류:", error);
  }

  const postsByCategory = {
    guide: (posts || []).filter((p) => p.category === "guide"),
    announcement: (posts || []).filter((p) => p.category === "announcement"),
    news: (posts || []).filter((p) => p.category === "news"),
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">가이드 & 공지사항</h1>
      <p className="text-gray-600 mb-8">AI 웹소설 작성 가이드와 프롬프티아 소식을 확인하세요</p>

      {/* 가이드 섹션 */}
      {postsByCategory.guide.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📚 AI 웹소설 작성 가이드</h2>
          <div className="space-y-3">
            {postsByCategory.guide.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 공지사항 섹션 */}
      {postsByCategory.announcement.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📢 공지사항</h2>
          <div className="space-y-3">
            {postsByCategory.announcement.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 뉴스 섹션 */}
      {postsByCategory.news.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">📰 뉴스</h2>
          <div className="space-y-3">
            {postsByCategory.news.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(!posts || posts.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          아직 게시된 글이 없습니다.
        </div>
      )}
    </div>
  );
}
