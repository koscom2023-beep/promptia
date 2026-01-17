/**
 * Cloudflare R2 스토리지 연동 모듈
 * S3 호환 API를 사용하여 이미지 업로드 및 Presigned URL 생성
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 설정 (환경 변수에서 가져옴)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
// R2_PUBLIC_URL은 클라이언트에서도 사용되므로 NEXT_PUBLIC_ 접두사 사용
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || ""; // CDN URL (예: https://pub-xxxxx.r2.dev)

// S3 호환 클라이언트 생성 (R2는 S3 호환 API 사용)
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * 이미지를 R2에 업로드
 * @param file - 업로드할 파일 (File 객체 또는 Buffer)
 * @param key - R2에 저장될 경로/파일명
 * @param contentType - MIME 타입 (예: 'image/jpeg', 'image/png')
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadToR2(
  file: File | Buffer,
  key: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  try {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      throw new Error("R2 환경 변수가 설정되지 않았습니다.");
    }

    // File 객체를 Buffer로 변환
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // R2에 업로드
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // 캐싱 설정: 1년간 캐시, immutable
      CacheControl: "public, max-age=31536000, immutable",
      // 공개 읽기 권한 설정 (선택사항)
      // ACL: "public-read", // R2에서는 ACL이 지원되지 않을 수 있으므로 Public Bucket 설정 필요
    });

    await s3Client.send(command);

    // 공개 URL 반환 (Public Bucket이 설정되어 있다면)
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL}/${key}`;
    }

    // Public URL이 없으면 Presigned URL 생성
    return await getPresignedUrl(key);
  } catch (error) {
    console.error("R2 업로드 오류:", error);
    throw error;
  }
}

/**
 * Presigned URL 생성 (임시 접근 URL, 만료 시간 설정 가능)
 * @param key - R2에 저장된 파일 경로
 * @param expiresIn - 만료 시간 (초 단위, 기본값: 1시간)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      throw new Error("R2 환경 변수가 설정되지 않았습니다.");
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Presigned URL 생성 오류:", error);
    throw error;
  }
}

/**
 * R2 공개 URL 생성 (Public Bucket이 설정된 경우)
 * @param key - R2에 저장된 파일 경로
 * @returns 공개 URL
 */
export function getR2PublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL 환경 변수가 설정되지 않았습니다.");
  }
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * 이미지 URL이 R2 URL인지 확인
 * @param url - 확인할 URL
 * @returns R2 URL 여부
 */
export function isR2Url(url: string): boolean {
  if (!R2_PUBLIC_URL) return false;
  return url.startsWith(R2_PUBLIC_URL) || url.includes(".r2.dev") || url.includes(".r2.cloudflarestorage.com");
}

/**
 * R2 설정 확인
 * @returns 설정 완료 여부
 */
export function isR2Configured(): boolean {
  return !!(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME
  );
}
