/**
 * R2 이미지 업로드 API 라우트
 * 클라이언트에서 이미지를 업로드할 때 사용
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    // R2 설정 확인
    const { isR2Configured } = await import("@/lib/r2");
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "images"; // 기본 폴더

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // 특수문자 제거
    const key = `${folder}/${timestamp}-${fileName}`;

    // 파일 검증
    const { validateUploadFile } = await import("@/app/actions/storage");
    const validation = await validateUploadFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "파일 검증에 실패했습니다." },
        { status: 400 }
      );
    }

    // R2에 업로드
    const url = await uploadToR2(file, key, file.type);

    return NextResponse.json({
      success: true,
      url,
      key,
    });
  } catch (error: any) {
    console.error("R2 업로드 오류:", error);
    return NextResponse.json(
      { error: error.message || "업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
