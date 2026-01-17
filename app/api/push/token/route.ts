import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * FCM 토큰 관리 API
 * 보고서 7장: 마케팅 자동화 - 푸시 알림
 */

/**
 * FCM 토큰 저장 (POST /api/push/token)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "토큰이 필요합니다." },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // FCM 토큰 저장 또는 업데이트
    // 참고: fcm_tokens 테이블이 필요합니다 (마이그레이션 필요)
    const { error: upsertError } = await supabase
      .from("fcm_tokens")
      .upsert(
        {
          user_id: user.id,
          token: token,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,token",
        }
      );

    if (upsertError) {
      console.error("FCM 토큰 저장 실패:", upsertError);
      return NextResponse.json(
        { error: "토큰 저장 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM 토큰 저장 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * FCM 토큰 삭제 (DELETE /api/push/token)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // FCM 토큰 삭제
    const { error: deleteError } = await supabase
      .from("fcm_tokens")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("FCM 토큰 삭제 실패:", deleteError);
      return NextResponse.json(
        { error: "토큰 삭제 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM 토큰 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
