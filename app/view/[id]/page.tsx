"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { voteForNovel } from "@/app/actions/vote";
import { ReportModal } from "@/components/ReportModal";

interface Novel {
  id: string;
  title: string;
  description: string | null;
  type: "novel" | "webtoon" | "video";
  thumbnail_url: string | null;
  view_count: number;
  vote_count: number;
}

interface Episode {
  id: string;
  title: string;
  content: string | null;
  image_urls: string[];
}

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // 작품 정보 가져오기
        const { data: novelData, error: novelError } = await supabase
          .from("novels")
          .select("*")
          .eq("id", id)
          .single();

        if (novelError || !novelData) {
          console.error("작품을 찾을 수 없습니다:", novelError);
          router.push("/");
          return;
        }

        // 블라인드 처리 확인
        if ((novelData as any).is_blocked === true) {
          setIsBlocked(true);
          setLoading(false);
          return;
        }

        setNovel(novelData as Novel);

        // 첫 번째 에피소드 가져오기
        const { data: episodeData, error: episodeError } = await supabase
          .from("episodes")
          .select("*")
          .eq("novel_id", id)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (episodeError || !episodeData) {
          console.error("에피소드를 찾을 수 없습니다:", episodeError);
          return;
        }

        // image_urls를 배열로 변환
        const imageUrls = Array.isArray(episodeData.image_urls)
          ? episodeData.image_urls
          : episodeData.image_urls
          ? [episodeData.image_urls]
          : [];

        setEpisode({
          ...episodeData,
          image_urls: imageUrls,
        } as Episode);

        // 조회수 증가
        await supabase
          .from("novels")
          .update({ view_count: (novelData.view_count || 0) + 1 })
          .eq("id", id);

        // localStorage에서 투표 여부 확인
        const votedNovels = JSON.parse(
          localStorage.getItem("votedNovels") || "[]"
        );
        if (votedNovels.includes(id)) {
          setHasVoted(true);
        }
      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, supabase, router]);

  const handleVote = async () => {
    if (hasVoted || !novel) {
      alert("이미 투표하셨습니다.");
      return;
    }

    setVoting(true);

    try {
      const result = await voteForNovel(novel.id);

      if (result.success) {
        // localStorage에 투표 기록 저장
        const votedNovels = JSON.parse(
          localStorage.getItem("votedNovels") || "[]"
        );
        votedNovels.push(novel.id);
        localStorage.setItem("votedNovels", JSON.stringify(votedNovels));

        // 투표수 업데이트
        setNovel({
          ...novel,
          vote_count: novel.vote_count + 1,
        });
        setHasVoted(true);
        alert("투표가 완료되었습니다!");
      } else {
        alert(result.error || "투표 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("투표 실패:", error);
      alert("투표 중 오류가 발생했습니다.");
    } finally {
      setVoting(false);
    }
  };

  // 유튜브 비디오 ID 추출
  const getYoutubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">운영 정책에 의해 블라인드 처리된 게시물입니다</div>
          <p className="text-gray-400">이 작품은 운영 정책 위반으로 인해 비공개 처리되었습니다.</p>
        </div>
      </div>
    );
  }

  if (!novel || !episode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">작품을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="bg-gray-800 px-4 py-6 md:px-8">
        <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
        {novel.description && (
          <p className="text-gray-300 mb-4">{novel.description}</p>
        )}
        <div className="flex gap-4 text-sm text-gray-400">
          <span>조회 {novel.view_count.toLocaleString()}</span>
          <span>추천 {novel.vote_count.toLocaleString()}</span>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">{episode.title}</h2>
        </div>

        {/* 소설 타입: 텍스트 */}
        {novel.type === "novel" && episode.content && (
          <div className="prose prose-invert max-w-none mb-8">
            <div className="whitespace-pre-wrap text-lg leading-relaxed">
              {episode.content}
            </div>
          </div>
        )}

        {/* 웹툰 타입: 이미지 */}
        {novel.type === "webtoon" && episode.image_urls.length > 0 && (
          <div className="space-y-4 mb-8">
            {episode.image_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${episode.title} - ${index + 1}`}
                className="w-full h-auto rounded-lg"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* 영상 타입: 유튜브 */}
        {novel.type === "video" && episode.content && (
          <div className="mb-8">
            <div className="aspect-video w-full">
              {(() => {
                const videoId = getYoutubeVideoId(episode.content);
                if (videoId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={novel.title}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">유효하지 않은 유튜브 링크입니다.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* AI Generated Content 경고 */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-300">
            ⚠️ AI Generated Content: 이 작품은 AI로 생성된 콘텐츠입니다.
          </p>
        </div>

        {/* 신고 버튼 */}
        <div className="mb-8">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
          >
            저작권 침해 및 유해 콘텐츠 신고
          </button>
        </div>

        {/* PICK 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleVote}
              disabled={hasVoted || voting}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                hasVoted
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {hasVoted ? "✓ 이미 추천하셨습니다" : voting ? "처리 중..." : "PICK (추천)"}
            </button>
          </div>
        </div>
      </div>

      {/* 신고 모달 */}
      {novel && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          novelId={novel.id}
          novelTitle={novel.title}
        />
      )}
    </div>
  );
}
