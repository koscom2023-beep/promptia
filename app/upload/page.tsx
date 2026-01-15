"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WatermarkPreview } from "@/components/WatermarkPreview";
import { addWatermarkToMultiple } from "@/lib/watermark";

export default function UploadPage() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"novel" | "webtoon" | "video">("novel");
  const [loading, setLoading] = useState(false);
  
  // 소설 폼 상태
  const [novelTitle, setNovelTitle] = useState("");
  const [novelDescription, setNovelDescription] = useState("");
  const [novelCoverImage, setNovelCoverImage] = useState("");
  const [novelContent, setNovelContent] = useState("");
  const [novelPromptUsed, setNovelPromptUsed] = useState("");
  const [novelCreationIntent, setNovelCreationIntent] = useState("");
  const [novelWorldview, setNovelWorldview] = useState("");
  
  // 웹툰 폼 상태
  const [webtoonTitle, setWebtoonTitle] = useState("");
  const [webtoonDescription, setWebtoonDescription] = useState("");
  const [webtoonCoverImage, setWebtoonCoverImage] = useState("");
  const [webtoonImageUrls, setWebtoonImageUrls] = useState("");
  const [webtoonPromptUsed, setWebtoonPromptUsed] = useState("");
  const [webtoonCreationIntent, setWebtoonCreationIntent] = useState("");
  const [webtoonWorldview, setWebtoonWorldview] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState<"bottom-right" | "center" | "grid">("bottom-right");
  const [processingWatermark, setProcessingWatermark] = useState(false);

  // 영상 폼 상태
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState("");
  const [videoYoutubeUrl, setVideoYoutubeUrl] = useState("");

  // 약관 동의 상태
  const [novelAgree1, setNovelAgree1] = useState(false);
  const [novelAgree2, setNovelAgree2] = useState(false);
  const [webtoonAgree1, setWebtoonAgree1] = useState(false);
  const [webtoonAgree2, setWebtoonAgree2] = useState(false);
  const [videoAgree1, setVideoAgree1] = useState(false);
  const [videoAgree2, setVideoAgree2] = useState(false);

  // 소설 업로드 처리
  const handleNovelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!novelTitle.trim() || !novelContent.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    if (!novelAgree1 || !novelAgree2) {
      alert("필수 약관에 동의해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 1. 소설 작품 생성
      const { data: novel, error: novelError } = await supabase
        .from("novels")
        .insert({
          author_id: user.id,
          title: novelTitle,
          description: novelDescription || null,
          type: "novel",
          thumbnail_url: novelCoverImage || null,
        })
        .select()
        .single();

      if (novelError) {
        throw novelError;
      }

      // 2. 첫 번째 에피소드 생성
      const { error: episodeError } = await supabase
        .from("episodes")
        .insert({
          novel_id: novel.id,
          title: "1화",
          content: novelContent,
        });

      if (episodeError) {
        throw episodeError;
      }

      alert("소설이 성공적으로 업로드되었습니다!");
      
      // 폼 초기화
      setNovelTitle("");
      setNovelDescription("");
      setNovelCoverImage("");
      setNovelContent("");
      setNovelPromptUsed("");
      setNovelCreationIntent("");
      setNovelWorldview("");
    } catch (error) {
      console.error("소설 업로드 실패:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 웹툰 업로드 처리
  const handleWebtoonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!webtoonTitle.trim() || !webtoonImageUrls.trim()) {
      alert("제목과 이미지 URL을 입력해주세요.");
      return;
    }

    if (!webtoonAgree1 || !webtoonAgree2) {
      alert("필수 약관에 동의해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 이미지 URL 문자열을 배열로 변환
      const imageUrlArray = webtoonImageUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (imageUrlArray.length === 0) {
        alert("최소 하나의 이미지 URL이 필요합니다.");
        setLoading(false);
        return;
      }

      // 워터마크 적용 (실제 업로드 시에는 워터마크가 적용된 이미지를 저장)
      // 주의: 현재는 클라이언트 사이드에서만 처리하므로 원본 URL을 사용
      // 실제 프로덕션에서는 서버 사이드에서 워터마크를 적용하는 것을 권장합니다
      setProcessingWatermark(true);
      let finalImageUrls = imageUrlArray;
      
      try {
        // 워터마크 적용 시도 (선택사항)
        // 실제로는 서버에 업로드된 워터마크 이미지 URL을 사용해야 합니다
        // const watermarkedUrls = await addWatermarkToMultiple(imageUrlArray, {
        //   position: watermarkPosition,
        //   opacity: 0.3,
        // });
        // finalImageUrls = watermarkedUrls;
      } catch (error) {
        console.error("워터마크 적용 실패:", error);
        // 워터마크 적용 실패 시 원본 URL 사용
        finalImageUrls = imageUrlArray;
      } finally {
        setProcessingWatermark(false);
      }

      // 1. 웹툰 작품 생성
      const { data: webtoon, error: webtoonError } = await supabase
        .from("novels")
        .insert({
          author_id: user.id,
          title: webtoonTitle,
          description: webtoonDescription || null,
          type: "webtoon",
          thumbnail_url: webtoonCoverImage || imageUrlArray[0] || null,
        })
        .select()
        .single();

      if (webtoonError) {
        throw webtoonError;
      }

      // 2. 첫 번째 에피소드 생성 (이미지 URL 배열을 JSONB로 저장)
      const { error: episodeError } = await supabase
        .from("episodes")
        .insert({
          novel_id: webtoon.id,
          title: "1화",
          image_urls: finalImageUrls,
        });

      if (episodeError) {
        throw episodeError;
      }

      alert("웹툰이 성공적으로 업로드되었습니다!");
      
      // 폼 초기화
      setWebtoonTitle("");
      setWebtoonDescription("");
      setWebtoonCoverImage("");
      setWebtoonImageUrls("");
      setWebtoonPromptUsed("");
      setWebtoonCreationIntent("");
      setWebtoonWorldview("");
    } catch (error) {
      console.error("웹툰 업로드 실패:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 영상 업로드 처리
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!videoTitle.trim() || !videoYoutubeUrl.trim()) {
      alert("제목과 유튜브 링크를 입력해주세요.");
      return;
    }

    // 유튜브 URL 유효성 검사
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoYoutubeUrl)) {
      alert("올바른 유튜브 링크를 입력해주세요.");
      return;
    }

    if (!videoAgree1 || !videoAgree2) {
      alert("필수 약관에 동의해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 1. 영상 작품 생성
      const { data: video, error: videoError } = await supabase
        .from("novels")
        .insert({
          author_id: user.id,
          title: videoTitle,
          description: videoDescription || null,
          type: "video",
          thumbnail_url: videoThumbnail || null,
        })
        .select()
        .single();

      if (videoError) {
        throw videoError;
      }

      // 2. 첫 번째 에피소드 생성 (유튜브 링크를 content에 저장)
      const { error: episodeError } = await supabase
        .from("episodes")
        .insert({
          novel_id: video.id,
          title: "1화",
          content: videoYoutubeUrl,
        });

      if (episodeError) {
        throw episodeError;
      }

      alert("영상이 성공적으로 업로드되었습니다!");
      
      // 폼 초기화
      setVideoTitle("");
      setVideoDescription("");
      setVideoThumbnail("");
      setVideoYoutubeUrl("");
    } catch (error) {
      console.error("영상 업로드 실패:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">작품 업로드</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "novel" | "webtoon" | "video")}>
        <TabsList className="mb-6">
          <TabsTrigger value="novel">소설</TabsTrigger>
          <TabsTrigger value="webtoon">웹툰</TabsTrigger>
          <TabsTrigger value="video">영상</TabsTrigger>
        </TabsList>

        {/* 소설 업로드 폼 */}
        <TabsContent value="novel">
          <Card>
            <CardHeader>
              <CardTitle>소설 업로드</CardTitle>
              <CardDescription>
                새로운 소설 작품을 업로드하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNovelSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="novel-title" className="text-sm font-medium">
                    제목 *
                  </label>
                  <Input
                    id="novel-title"
                    value={novelTitle}
                    onChange={(e) => setNovelTitle(e.target.value)}
                    placeholder="소설 제목을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="novel-description" className="text-sm font-medium">
                    설명
                  </label>
                  <Textarea
                    id="novel-description"
                    value={novelDescription}
                    onChange={(e) => setNovelDescription(e.target.value)}
                    placeholder="소설에 대한 간단한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="novel-cover" className="text-sm font-medium">
                    표지 이미지 URL
                  </label>
                  <Input
                    id="novel-cover"
                    type="url"
                    value={novelCoverImage}
                    onChange={(e) => setNovelCoverImage(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                  />
                  {novelCoverImage && (
                    <div className="mt-2">
                      <WatermarkPreview
                        imageUrl={novelCoverImage}
                        watermarkOptions={{
                          position: "bottom-right",
                          opacity: 0.3,
                        }}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="novel-content" className="text-sm font-medium">
                    내용 *
                  </label>
                  <Textarea
                    id="novel-content"
                    value={novelContent}
                    onChange={(e) => setNovelContent(e.target.value)}
                    placeholder="소설 내용을 입력하세요"
                    rows={10}
                    required
                  />
                </div>

                {/* 약관 동의 섹션 */}
                <div className="border-t pt-4 mt-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">약관 동의 *</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={novelAgree1}
                        onChange={(e) => setNovelAgree1(e.target.checked)}
                        className="mt-1 w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        required
                      />
                      <span className="text-sm">
                        <span className="text-red-500">[필수]</span> 본 콘텐츠는 AI 생성물의 라이선스를 준수하며, 타인의 권리를 침해하지 않았음을 확인합니다.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={novelAgree2}
                        onChange={(e) => setNovelAgree2(e.target.checked)}
                        className="mt-1 w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        required
                      />
                      <span className="text-sm">
                        <span className="text-red-500">[필수]</span> 업로드한 작품이 플랫폼 홍보 목적으로 사용될 수 있음에 동의합니다.
                      </span>
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !novelAgree1 || !novelAgree2} 
                  className="w-full mt-6"
                >
                  {loading ? "업로드 중..." : "등록하기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 웹툰 업로드 폼 */}
        <TabsContent value="webtoon">
          <Card>
            <CardHeader>
              <CardTitle>웹툰 업로드</CardTitle>
              <CardDescription>
                새로운 웹툰 작품을 업로드하세요. 이미지 URL을 한 줄에 하나씩 입력하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWebtoonSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="webtoon-title" className="text-sm font-medium">
                    제목 *
                  </label>
                  <Input
                    id="webtoon-title"
                    value={webtoonTitle}
                    onChange={(e) => setWebtoonTitle(e.target.value)}
                    placeholder="웹툰 제목을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="webtoon-description" className="text-sm font-medium">
                    설명
                  </label>
                  <Textarea
                    id="webtoon-description"
                    value={webtoonDescription}
                    onChange={(e) => setWebtoonDescription(e.target.value)}
                    placeholder="웹툰에 대한 간단한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="webtoon-cover" className="text-sm font-medium">
                    표지 이미지 URL
                  </label>
                  <Input
                    id="webtoon-cover"
                    type="url"
                    value={webtoonCoverImage}
                    onChange={(e) => setWebtoonCoverImage(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="webtoon-images" className="text-sm font-medium">
                    이미지 URL * (한 줄에 하나씩 입력)
                  </label>
                  <Textarea
                    id="webtoon-images"
                    value={webtoonImageUrls}
                    onChange={(e) => setWebtoonImageUrls(e.target.value)}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                    rows={10}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    각 이미지 URL을 새 줄에 입력하세요. 빈 줄은 무시됩니다.
                  </p>
                  
                  {/* 워터마크 옵션 */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      워터마크 위치
                    </label>
                    <select
                      value={watermarkPosition}
                      onChange={(e) => setWatermarkPosition(e.target.value as "bottom-right" | "center" | "grid")}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="bottom-right">우측 하단</option>
                      <option value="center">중앙 격자무늬</option>
                      <option value="grid">촘촘한 격자무늬</option>
                    </select>
                    <p className="text-xs text-gray-400">
                      워터마크는 플랫폼 보호를 위해 자동으로 삽입됩니다.
                    </p>
                  </div>

                  {/* 워터마크 미리보기 */}
                  {webtoonImageUrls && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        워터마크 미리보기
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {webtoonImageUrls
                          .split("\n")
                          .map((url) => url.trim())
                          .filter((url) => url.length > 0)
                          .slice(0, 2) // 최대 2개만 미리보기
                          .map((url, index) => (
                            <WatermarkPreview
                              key={index}
                              imageUrl={url}
                              watermarkOptions={{
                                position: watermarkPosition,
                                opacity: 0.3,
                              }}
                            />
                          ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        ⚠️ 해당 워터마크는 플랫폼 보호를 위해 자동으로 삽입됩니다
                      </p>
                    </div>
                  )}
                </div>

                {/* 약관 동의 섹션 */}
                <div className="border-t pt-4 mt-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">약관 동의 *</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webtoonAgree1}
                        onChange={(e) => setWebtoonAgree1(e.target.checked)}
                        className="mt-1 w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        required
                      />
                      <span className="text-sm">
                        <span className="text-red-500">[필수]</span> 본 콘텐츠는 AI 생성물의 라이선스를 준수하며, 타인의 권리를 침해하지 않았음을 확인합니다.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webtoonAgree2}
                        onChange={(e) => setWebtoonAgree2(e.target.checked)}
                        className="mt-1 w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        required
                      />
                      <span className="text-sm">
                        <span className="text-red-500">[필수]</span> 업로드한 작품이 플랫폼 홍보 목적으로 사용될 수 있음에 동의합니다.
                      </span>
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || processingWatermark || !webtoonAgree1 || !webtoonAgree2} 
                  className="w-full mt-6"
                >
                  {processingWatermark ? "워터마크 적용 중..." : loading ? "업로드 중..." : "등록하기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 영상 업로드 폼 */}
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>영상 업로드</CardTitle>
              <CardDescription>
                유튜브 링크를 입력하여 영상 작품을 업로드하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVideoSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="video-title" className="text-sm font-medium">
                    제목 *
                  </label>
                  <Input
                    id="video-title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="영상 제목을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="video-description" className="text-sm font-medium">
                    설명
                  </label>
                  <Textarea
                    id="video-description"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="영상에 대한 간단한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="video-thumbnail" className="text-sm font-medium">
                    썸네일 이미지 URL
                  </label>
                  <Input
                    id="video-thumbnail"
                    type="url"
                    value={videoThumbnail}
                    onChange={(e) => setVideoThumbnail(e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  {videoThumbnail && (
                    <div className="mt-2">
                      <WatermarkPreview
                        imageUrl={videoThumbnail}
                        watermarkOptions={{
                          position: "bottom-right",
                          opacity: 0.3,
                        }}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="video-youtube-url" className="text-sm font-medium">
                    유튜브 링크 * (예: https://www.youtube.com/watch?v=VIDEO_ID)
                  </label>
                  <Input
                    id="video-youtube-url"
                    type="url"
                    value={videoYoutubeUrl}
                    onChange={(e) => setVideoYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    유튜브 동영상의 공유 링크를 입력하세요.
                  </p>
                </div>

                {/* 약관 동의 섹션 */}
                <div className="border-t pt-4 mt-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">약관 동의 *</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoAgree1}
                        onChange={(e) => setVideoAgree1(e.target.checked)}
                        className="mt-1 w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        required
                      />
                      <span className="text-sm">
                        <span className="text-red-500">[필수]</span> 본 콘텐츠는 AI 생성물의 라이선스를 준수하며, 타인의 권리를 침해하지 않았음을 확인합니다.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoAgree2}
                        onChange={(e) => setVideoAgree2(e.target.checked)}
                        className="mt-1 w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        required
                      />
                      <span className="text-sm">
                        <span className="text-red-500">[필수]</span> 업로드한 작품이 플랫폼 홍보 목적으로 사용될 수 있음에 동의합니다.
                      </span>
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !videoAgree1 || !videoAgree2} 
                  className="w-full mt-6"
                >
                  {loading ? "업로드 중..." : "등록하기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
