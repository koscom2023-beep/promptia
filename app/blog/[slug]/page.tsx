import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, content")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!post) {
    return {
      title: "게시글을 찾을 수 없습니다",
    };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 160),
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (error || !post) {
    notFound();
  }

  // 조회수 증가
  await supabase
    .from("blog_posts")
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq("id", post.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/blog"
        className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← 목록으로
      </Link>

      <article className="bg-white rounded-lg shadow-sm p-8">
        <header className="mb-6">
          <div className="text-sm text-gray-500 mb-2">
            {new Date(post.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          {post.category && (
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {post.category === "guide" && "가이드"}
              {post.category === "announcement" && "공지사항"}
              {post.category === "news" && "뉴스"}
            </span>
          )}
        </header>

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
