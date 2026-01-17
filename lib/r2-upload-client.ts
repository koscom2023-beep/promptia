/**
 * R2 보안 업로드 클라이언트 유틸리티
 * 클라이언트 컴포넌트에서 사용하는 업로드 함수
 * 
 * 이 파일은 클라이언트 사이드에서 실행되므로 "use client"가 필요합니다.
 */

"use client";

import { generatePresignedUploadUrl, validateUploadFile } from "@/app/actions/storage";

/**
 * Presigned URL로 파일 업로드 (클라이언트 사이드)
 */
async function uploadToPresignedUrl(
  presignedUrl: string,
  file: File
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
    });

    if (!response.ok) {
      throw new Error(`업로드 실패: ${response.statusText}`);
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("R2 업로드 오류:", error);
    return {
      success: false,
      error: error.message || "파일 업로드에 실패했습니다.",
    };
  }
}

/**
 * 파일을 R2에 업로드하는 헬퍼 함수 (클라이언트 사이드)
 * 
 * @param file - 업로드할 파일
 * @param folder - 저장할 폴더 경로 (기본값: "images")
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadFileToR2Secure(
  file: File,
  folder: string = "images"
): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  try {
    // 1. 파일 검증 (서버 사이드)
    const validation = await validateUploadFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || "파일 검증에 실패했습니다.",
      };
    }

    // 2. Presigned URL 발급 (서버 사이드)
    const { presignedUrl, publicUrl, key } = await generatePresignedUploadUrl(
      file.name,
      folder,
      file.type
    );

    // 3. Presigned URL로 직접 업로드 (클라이언트 사이드)
    const uploadResult = await uploadToPresignedUrl(presignedUrl, file);

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || "파일 업로드에 실패했습니다.",
      };
    }

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error: any) {
    console.error("R2 보안 업로드 오류:", error);
    return {
      success: false,
      error: error.message || "파일 업로드 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 여러 파일을 순차적으로 업로드 (클라이언트 사이드)
 * 
 * @param files - 업로드할 파일 배열
 * @param folder - 저장할 폴더 경로
 * @returns 업로드 결과 배열
 */
export async function uploadMultipleFilesToR2(
  files: File[],
  folder: string = "images"
): Promise<Array<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  filename: string;
}>> {
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await uploadFileToR2Secure(file, folder);
      return {
        ...result,
        filename: file.name,
      };
    })
  );

  return results;
}
