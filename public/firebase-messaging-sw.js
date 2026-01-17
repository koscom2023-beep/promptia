/**
 * Firebase Cloud Messaging Service Worker
 * 보고서 7장: 마케팅 자동화 - 푸시 알림
 * 
 * 브라우저 웹 푸시 알림을 처리하는 서비스 워커
 */

// Firebase SDK import (ES6 모듈 방식)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정
// 환경 변수는 서비스 워커에서 직접 접근할 수 없으므로,
// 빌드 시점에 주입되거나 별도 설정 파일에서 로드해야 합니다.
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
  measurementId: "YOUR_FIREBASE_MEASUREMENT_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase Messaging 인스턴스 가져오기
const messaging = firebase.messaging();

/**
 * 백그라운드 메시지 수신 처리
 * 앱이 백그라운드에 있을 때 푸시 알림을 받으면 실행됩니다.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '프롬프티아';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 있습니다.',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    image: payload.notification?.image,
    data: payload.data || {},
    tag: payload.data?.tag || 'default',
    requireInteraction: payload.data?.requireInteraction || false,
    actions: payload.data?.actions || [],
  };

  // 알림 표시
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * 알림 클릭 이벤트 처리
 * 사용자가 알림을 클릭하면 해당 페이지로 이동합니다.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 클릭:', event);

  event.notification.close();

  // 알림 데이터에서 URL 가져오기
  const urlToOpen = event.notification.data?.url || event.notification.data?.click_action || '/';

  // 클라이언트 열기 또는 새 창 열기
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // 이미 열려있는 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * 알림 닫기 이벤트 처리
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 닫기:', event);
  
  // 알림 닫기 이벤트를 서버에 전송할 수 있습니다.
  // 예: 분석 목적
});
