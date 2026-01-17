"use client";

import { useEffect, useState } from "react";
import { getFCMToken, onForegroundMessage, saveFCMTokenToServer } from "@/lib/firebase/messaging";

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

/**
 * 푸시 알림 Provider
 * 앱 초기화 시 FCM 토큰을 가져오고 포그라운드 메시지를 처리합니다.
 */
export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const [, setIsInitialized] = useState(false);

  useEffect(() => {
    // FCM 초기화 및 토큰 가져오기
    let unsubscribe: (() => void) | null = null;

    const initializePushNotifications = async () => {
      try {
        // FCM 토큰 가져오기
        const token = await getFCMToken();
        
        if (token) {
          // 서버에 토큰 저장
          await saveFCMTokenToServer(token);
          console.log("FCM 토큰 저장 완료");
        }

        // 포그라운드 메시지 리스너 등록
        unsubscribe = onForegroundMessage((payload) => {
          console.log("포그라운드 메시지 수신:", payload);
          
          // 브라우저 알림 표시 (선택사항)
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(payload.notification?.title || "프롬프티아", {
              body: payload.notification?.body,
              icon: payload.notification?.icon || "/icon-192x192.png",
              badge: "/badge-72x72.png",
              ...(payload.notification?.image && { image: payload.notification.image } as any),
              data: payload.data,
              tag: payload.data?.tag,
            });
          }
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("푸시 알림 초기화 실패:", error);
        setIsInitialized(true); // 실패해도 앱은 계속 실행
      }
    };

    initializePushNotifications();

    // 클린업 함수
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return <>{children}</>;
}
