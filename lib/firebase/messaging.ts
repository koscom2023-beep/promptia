"use client";

import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { firebaseConfig } from "./config";

/**
 * Firebase Cloud Messaging 토큰 관리
 * 보고서 7장: 마케팅 자동화 - 푸시 알림
 */

let messaging: Messaging | null = null;
let app: FirebaseApp | null = null;

/**
 * Firebase 앱 초기화
 */
function initializeFirebase(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase는 클라이언트에서만 사용할 수 있습니다.");
  }

  if (app) {
    return app;
  }

  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }

  return app;
}

/**
 * FCM 토큰 가져오기
 * 브라우저의 푸시 알림 권한을 요청하고 FCM 토큰을 반환합니다.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return null;
    }

    // Service Worker 지원 확인
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker를 지원하지 않는 브라우저입니다.");
      return null;
    }

    // 푸시 알림 권한 확인
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("푸시 알림 권한이 거부되었습니다.");
      return null;
    }

    // Firebase 초기화
    const firebaseApp = initializeFirebase();

    // Messaging 인스턴스 가져오기
    if (!messaging) {
      messaging = getMessaging(firebaseApp);
    }

    // VAPID 키 (Firebase Console에서 생성)
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error("FIREBASE_VAPID_KEY가 설정되지 않았습니다.");
      return null;
    }

    // FCM 토큰 가져오기
    const token = await getToken(messaging, {
      vapidKey,
    });

    if (token) {
      console.log("FCM 토큰 가져오기 성공:", token);
      return token;
    } else {
      console.warn("FCM 토큰을 가져올 수 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("FCM 토큰 가져오기 실패:", error);
    return null;
  }
}

/**
 * 포그라운드 메시지 수신 처리
 * 앱이 포그라운드에 있을 때 푸시 알림을 받으면 실행됩니다.
 */
export function onForegroundMessage(
  callback: (payload: any) => void
): () => void {
  try {
    if (typeof window === "undefined") {
      return () => {};
    }

    const firebaseApp = initializeFirebase();

    if (!messaging) {
      messaging = getMessaging(firebaseApp);
    }

    // 포그라운드 메시지 리스너 등록
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("포그라운드 메시지 수신:", payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error("포그라운드 메시지 리스너 등록 실패:", error);
    return () => {};
  }
}

/**
 * FCM 토큰을 서버에 저장
 */
export async function saveFCMTokenToServer(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/push/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("토큰 저장 실패");
    }

    return true;
  } catch (error) {
    console.error("FCM 토큰 저장 실패:", error);
    return false;
  }
}

/**
 * FCM 토큰 삭제
 */
export async function deleteFCMTokenFromServer(): Promise<boolean> {
  try {
    const response = await fetch("/api/push/token", {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("토큰 삭제 실패");
    }

    return true;
  } catch (error) {
    console.error("FCM 토큰 삭제 실패:", error);
    return false;
  }
}
