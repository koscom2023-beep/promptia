"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isR2Configured } from "@/lib/r2";

// R2 설정
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// S3 호환 클라이언트 생성
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// 허용된 이미지 확장자
const ALLOWED_EXTENSIONS = ["webp", "jpg", "jpeg", "png"];
const ALLOWED_MIME_TYPES = ["image/webp", "image/jpeg", "image/jpg", "image/png"];

// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * 파일 확장자 검증
 */
function validateFileExtension(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
}

/**
 * 파일 크기 검증
 */
function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * MIME 타입 검증
 */
function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

/**
 * 파일명에서 확장자 추출 및 MIME 타입 매핑
 */
function getContentTypeFromFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return mimeMap[extension || ""] || "image/jpeg";
}

/**
 * 보안 업로드를 위한 Presigned URL 발급
 * 클라이언트에서 직접 R2에 업로드할 수 있는 임시 URL을 생성합니다.
 * 
 * @param filename - 업로드할 파일명
 * @param folder - 저장할 폴더 경로 (기본값: "images")
 * @param contentType - MIME 타입 (선택사항, 파일명에서 자동 추론)
 * @returns Presigned URL 및 업로드 정보
 */
export async function generatePresignedUploadUrl(
  filename: string,
  folder: string = "images",
  contentType?: string
): Promise<{
  presignedUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}> {
  try {
    // R2 설정 확인
    if (!isR2Configured()) {
      throw new Error("R2가 설정되지 않았습니다.");
    }

    // 파일 확장자 검증
    if (!validateFileExtension(filename)) {
      throw new Error(
        `허용되지 않은 파일 형식입니다. 허용된 형식: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
    }

    // MIME 타입 결정
    const finalContentType = contentType || getContentTypeFromFilename(filename);
    
    // MIME 타입 검증
    if (!validateMimeType(finalContentType)) {
      throw new Error(
        `허용되지 않은 MIME 타입입니다. 허용된 타입: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    // 파일명 정리 (특수문자 제거, 타임스탬프 추가)
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const key = `${folder}/${timestamp}-${sanitizedFilename}`;

    // Presigned URL 생성 (5분 유효)
    const expiresIn = 300; // 5분 (초 단위)
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: finalContentType,
      // 캐싱 설정: 1년간 캐시, immutable
      CacheControl: "public, max-age=31536000, immutable",
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    // 공개 URL 생성 (Public Bucket이 설정된 경우)
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${key}`
      : presignedUrl; // Public URL이 없으면 Presigned URL 반환

    return {
      presignedUrl,
      publicUrl,
      key,
      expiresIn,
    };
  } catch (error: any) {
    console.error("Presigned URL 생성 오류:", error);
    throw new Error(error.message || "Presigned URL 생성에 실패했습니다.");
  }
}

/**
 * 파일 검증 (서버 사이드)
 * 클라이언트에서 업로드 전에 파일을 검증합니다.
 * 
 * @param file - 검증할 파일 정보
 * @returns 검증 결과
 */
export async function validateUploadFile(file: {
  name: string;
  size: number;
  type: string;
}): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // 파일명 검증
    if (!file.name || file.name.trim() === "") {
      return {
        valid: false,
        error: "파일명이 필요합니다.",
      };
    }

    // 확장자 검증
    if (!validateFileExtension(file.name)) {
      return {
        valid: false,
        error: `허용되지 않은 파일 형식입니다. 허용된 형식: ${ALLOWED_EXTENSIONS.join(", ")}`,
      };
    }

    // 파일 크기 검증
    if (!validateFileSize(file.size)) {
      return {
        valid: false,
        error: `파일 크기는 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 허용됩니다.`,
      };
    }

    // MIME 타입 검증
    if (file.type && !validateMimeType(file.type)) {
      return {
        valid: false,
        error: `허용되지 않은 MIME 타입입니다. 허용된 타입: ${ALLOWED_MIME_TYPES.join(", ")}`,
      };
    }

    return {
      valid: true,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "파일 검증 중 오류가 발생했습니다.",
    };
  }
}

