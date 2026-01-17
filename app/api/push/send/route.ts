import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 푸시 알림 전송 API
 * 보고서 7장: 마케팅 자동화 - 푸시 알림
 * 
 * Firebase Admin SDK를 사용하여 푸시 알림을 전송합니다.
 */

// Firebase Admin 초기화 (동적 import)
let firebaseAdmin: any = null;

async function initializeFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY가 설정되지 않았습니다.");
  }

  const admin = await import("firebase-admin");
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  firebaseAdmin = admin;
  return admin;
}

/**
 * 푸시 알림 전송 (POST /api/push/send)
 * 
 * Request Body:
 * {
 *   "userId": string (optional, 특정 사용자에게 전송),
 *   "title": string,
 *   "body": string,
 *   "data": object (optional),
 *   "imageUrl": string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { userId, title, body: messageBody, data, imageUrl } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "제목과 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // 관리자 권한 확인 (선택사항)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Firebase Admin 초기화
    const admin = await initializeFirebaseAdmin();

    // FCM 토큰 가져오기
    let query = supabase.from("fcm_tokens").select("token");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError || !tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: "전송할 토큰이 없습니다." },
        { status: 404 }
      );
    }

    // 푸시 알림 메시지 구성
    const message = {
      notification: {
        title,
        body: messageBody,
        imageUrl,
      },
      data: data || {},
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
        },
      },
    };

    // 각 토큰에 대해 알림 전송
    const results = await Promise.allSettled(
      tokens.map((tokenData: any) =>
        admin.messaging().send({
          ...message,
          token: tokenData.token,
        })
      )
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failureCount = results.filter(
      (r) => r.status === "rejected"
    ).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: tokens.length,
    });
  } catch (error: any) {
    console.error("푸시 알림 전송 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
