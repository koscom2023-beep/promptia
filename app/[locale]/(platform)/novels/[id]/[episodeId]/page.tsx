import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { NovelViewer } from "@/components/NovelViewer";
import { WebtoonViewer } from "@/components/WebtoonViewer";
import { CommentsSection } from "@/components/CommentsSection";
import { VoteButton } from "@/components/VoteButton";
import { InArticleAd } from "@/components/ads/AdSlot";
import type { Metadata } from "next";

interface PageProps {
  params: {
    locale: string;
    id: string;
    episodeId: string;
  };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = await createClient();

  const { data: episode } = await supabase
    .from("episodes")
    .select(`
      id,
      title,
      novel:novels(title, type, description, thumbnail_url)
    `)
    .eq("id", params.episodeId)
    .single();

  if (!episode || !episode.novel) {
    return {
      title: "에피소드를 찾을 수 없습니다",
    };
  }

  const novel = Array.isArray(episode.novel) ? episode.novel[0] : episode.novel;

  return {
    title: `${episode.title} - ${novel.title}`,
    description: novel.description || `${episode.title}을(를) 읽어보세요.`,
  };
}

export default async function EpisodePage({ params }: PageProps) {
  const supabase = await createClient();

  // 에피소드 데이터 가져오기
  const { data: episode, error } = await supabase
    .from("episodes")
    .select(`
      id,
      title,
      content,
      image_urls,
      novel:novels(id, title, type, thumbnail_url)
    `)
    .eq("id", params.episodeId)
    .single();

  if (error || !episode) {
    notFound();
  }

  const novel = Array.isArray(episode.novel) ? episode.novel[0] : episode.novel;

  if (!novel) {
    notFound();
  }

  // 댓글 데이터 가져오기
  const { data: comments } = await supabase
    .from("comments")
    .select("id, user_nickname, content, created_at")
    .eq("novel_id", novel.id)
    .order("created_at", { ascending: false });

  const initialComments = comments || [];

  // 투표 수 가져오기
  const { count: voteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("novel_id", novel.id);

  // 현재 사용자가 투표했는지 확인
  const { data: { user } } = await supabase.auth.getUser();
  let hasVoted = false;
  
  if (user) {
    const { data: userVote } = await supabase
      .from("votes")
      .select("id")
      .eq("novel_id", novel.id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    
    hasVoted = !!userVote;
  }

  // 타입에 따라 다른 뷰어 렌더링
  return (
    <div className="min-h-screen bg-[#161b26] text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 작품 정보 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{episode.title}</h1>
          <p className="text-gray-400">{novel.title}</p>
        </div>

        {/* 뷰어 */}
        {novel.type === "novel" && episode.content && (
          <NovelViewer content={episode.content} />
        )}
        
        {novel.type === "webtoon" && episode.image_urls && (
          <WebtoonViewer images={episode.image_urls as string[]} />
        )}

        {/* 광고 #1 - 본문과 투표 사이 */}
        <InArticleAd slotId="1111111111" />

        {/* 투표 버튼 (낙관적 업데이트) */}
        <div className="my-8 flex justify-center">
          <VoteButton 
            episodeId={episode.id}
            hasVoted={hasVoted}
            voteCount={voteCount || 0}
          />
        </div>

        {/* 광고 #2 - 투표와 댓글 사이 */}
        <InArticleAd slotId="2222222222" />

        {/* 댓글 섹션 */}
        <CommentsSection 
          episodeId={episode.id}
          novelId={novel.id}
          initialComments={initialComments}
        />

        {/* 광고 #3 - 댓글 하단 */}
        <div className="mt-8">
          <InArticleAd slotId="3333333333" />
        </div>
      </div>
    </div>
  );
}
