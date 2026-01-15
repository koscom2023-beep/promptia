"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UploadPage() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"novel" | "webtoon">("novel");
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

    // 작가의 말 필수 검증 (300자 이상)
    const authorNotes = `${novelPromptUsed} ${novelCreationIntent} ${novelWorldview}`.trim();
    if (authorNotes.length < 300) {
      alert("작가의 말(사용한 프롬프트, 제작 의도, 세계관 설명)을 총 300자 이상 입력해주세요. 이는 AdSense 승인을 위해 필요합니다.");
      return;
    }

    setLoading(true);

    try {
      // 1. 소설 작품 생성
      const { data: novel, error: novelError } = await supabase
        .from("novels")
        .insert({
          user_id: user.id,
          title: novelTitle,
          description: novelDescription || null,
          category: "novel",
          cover_image_url: novelCoverImage || null,
          prompt_used: novelPromptUsed || null,
          creation_intent: novelCreationIntent || null,
          worldview_description: novelWorldview || null,
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
          user_id: user.id,
          title: "1화",
          content: novelContent,
          episode_number: 1,
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

    // 작가의 말 필수 검증 (300자 이상)
    const authorNotes = `${webtoonPromptUsed} ${webtoonCreationIntent} ${webtoonWorldview}`.trim();
    if (authorNotes.length < 300) {
      alert("작가의 말(사용한 프롬프트, 제작 의도, 세계관 설명)을 총 300자 이상 입력해주세요. 이는 AdSense 승인을 위해 필요합니다.");
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

      // 1. 웹툰 작품 생성
      const { data: webtoon, error: webtoonError } = await supabase
        .from("novels")
        .insert({
          user_id: user.id,
          title: webtoonTitle,
          description: webtoonDescription || null,
          category: "webtoon",
          cover_image_url: webtoonCoverImage || imageUrlArray[0] || null,
          prompt_used: webtoonPromptUsed || null,
          creation_intent: webtoonCreationIntent || null,
          worldview_description: webtoonWorldview || null,
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
          user_id: user.id,
          title: "1화",
          image_urls: imageUrlArray,
          episode_number: 1,
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">작품 업로드</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "novel" | "webtoon")}>
        <TabsList className="mb-6">
          <TabsTrigger value="novel">소설</TabsTrigger>
          <TabsTrigger value="webtoon">웹툰</TabsTrigger>
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

                {/* 작가의 말 섹션 */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-semibold mb-4">작가의 말 * (AdSense 승인을 위해 필수)</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    총 300자 이상 입력해주세요. 이 정보는 구글 검색 최적화와 AdSense 승인에 도움이 됩니다.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="novel-prompt" className="text-sm font-medium">
                        사용한 프롬프트
                      </label>
                      <Textarea
                        id="novel-prompt"
                        value={novelPromptUsed}
                        onChange={(e) => setNovelPromptUsed(e.target.value)}
                        placeholder="이 작품을 만들 때 사용한 AI 프롬프트를 입력하세요"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="novel-intent" className="text-sm font-medium">
                        제작 의도
                      </label>
                      <Textarea
                        id="novel-intent"
                        value={novelCreationIntent}
                        onChange={(e) => setNovelCreationIntent(e.target.value)}
                        placeholder="이 작품을 만들게 된 의도나 목적을 설명해주세요"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="novel-worldview" className="text-sm font-medium">
                        세계관 설명
                      </label>
                      <Textarea
                        id="novel-worldview"
                        value={novelWorldview}
                        onChange={(e) => setNovelWorldview(e.target.value)}
                        placeholder="작품의 배경이 되는 세계관이나 설정을 설명해주세요"
                        rows={3}
                      />
                    </div>

                    <div className="text-xs text-gray-500">
                      현재 입력된 글자 수: {`${novelPromptUsed} ${novelCreationIntent} ${novelWorldview}`.trim().length} / 300자
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "업로드 중..." : "업로드"}
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
                </div>

                {/* 작가의 말 섹션 */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-semibold mb-4">작가의 말 * (AdSense 승인을 위해 필수)</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    총 300자 이상 입력해주세요. 이 정보는 구글 검색 최적화와 AdSense 승인에 도움이 됩니다.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="webtoon-prompt" className="text-sm font-medium">
                        사용한 프롬프트
                      </label>
                      <Textarea
                        id="webtoon-prompt"
                        value={webtoonPromptUsed}
                        onChange={(e) => setWebtoonPromptUsed(e.target.value)}
                        placeholder="이 작품을 만들 때 사용한 AI 프롬프트를 입력하세요"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="webtoon-intent" className="text-sm font-medium">
                        제작 의도
                      </label>
                      <Textarea
                        id="webtoon-intent"
                        value={webtoonCreationIntent}
                        onChange={(e) => setWebtoonCreationIntent(e.target.value)}
                        placeholder="이 작품을 만들게 된 의도나 목적을 설명해주세요"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="webtoon-worldview" className="text-sm font-medium">
                        세계관 설명
                      </label>
                      <Textarea
                        id="webtoon-worldview"
                        value={webtoonWorldview}
                        onChange={(e) => setWebtoonWorldview(e.target.value)}
                        placeholder="작품의 배경이 되는 세계관이나 설정을 설명해주세요"
                        rows={3}
                      />
                    </div>

                    <div className="text-xs text-gray-500">
                      현재 입력된 글자 수: {`${webtoonPromptUsed} ${webtoonCreationIntent} ${webtoonWorldview}`.trim().length} / 300자
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "업로드 중..." : "업로드"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
