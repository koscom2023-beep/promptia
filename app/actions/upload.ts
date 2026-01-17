"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 작품 업로드 Server Action
 * 
 * @param formData - 작품 정보
 * @returns 업로드 결과
 */
export async function uploadContent(formData: FormData) {
  try {
    const supabase = await createClient();

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const thumbnailUrl = formData.get("thumbnailUrl") as string;

    if (!type || !title) {
      return { success: false, error: "작품 유형과 제목은 필수입니다." };
    }

    // 작품 생성
    const { data: novel, error: novelError } = await supabase
      .from("novels")
      .insert({
        author_id: user.id,
        title,
        description: description || null,
        type,
        thumbnail_url: thumbnailUrl || null,
        view_count: 0,
        vote_count: 0,
      })
      .select()
      .single();

    if (novelError) {
      console.error("작품 생성 오류:", novelError);
      return { success: false, error: novelError.message };
    }

    // 에피소드 생성
    const episodeTitle = formData.get("episodeTitle") as string || "1화";
    const content = formData.get("content") as string;
    const imageUrls = formData.get("imageUrls") as string;

    const episodeData: any = {
      novel_id: novel.id,
      title: episodeTitle,
    };

    if (type === "novel") {
      episodeData.content = content;
    } else if (type === "webtoon") {
      // JSON 문자열을 파싱하여 배열로 저장
      episodeData.image_urls = imageUrls ? JSON.parse(imageUrls) : [];
    } else if (type === "video") {
      episodeData.content = content; // 유튜브 URL
    }

    const { error: episodeError } = await supabase
      .from("episodes")
      .insert(episodeData);

    if (episodeError) {
      console.error("에피소드 생성 오류:", episodeError);
      return { success: false, error: episodeError.message };
    }

    // AI 자동 검수 (선택사항)
    try {
      const { moderateNovel } = await import("@/app/actions/moderation-ai");
      await moderateNovel(novel.id);
    } catch (error) {
      console.warn("자동 검수 실패:", error);
    }

    // 캐시 갱신
    revalidatePath("/");
    
    // 성공 시 작품 페이지로 리다이렉트
    redirect(`/ko/novels/${novel.id}`);
  } catch (error: any) {
    console.error("작품 업로드 중 오류:", error);
    return { 
      success: false, 
      error: error.message || "작품 업로드에 실패했습니다." 
    };
  }
}

/**
 * Supabase Storage에 파일 업로드
 * user_id/uuid.확장자 형태로 저장
 */
export async function uploadFileToStorage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // 파일 확장자 추출
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uuid = crypto.randomUUID();
    const fileName = `${userId}/${uuid}.${extension}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from("content")
      .upload(fileName, file, {
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from("content")
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "파일 업로드 실패",
    };
  }
}

