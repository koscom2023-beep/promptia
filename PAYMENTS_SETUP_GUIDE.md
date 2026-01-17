# 결제 시스템 설정 가이드

## 개요

프롬프티아는 Stripe와 Toss Payments를 지원하는 결제 시스템을 제공합니다.

## 환경 변수 설정

### Stripe

```env
# Stripe Secret Key (서버 전용)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Public Key (클라이언트용, 필요시)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

### Toss Payments

```env
# Toss Payments Secret Key (서버 전용)
TOSS_SECRET_KEY=test_sk_...

# Toss Payments Client Key (클라이언트용)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
```

## API 사용법

### 결제 생성

```typescript
// POST /api/payments
const response = await fetch("/api/payments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    provider: "stripe", // 또는 "toss"
    amount: 10000, // 금액 (센트 또는 원)
    currency: "usd", // 또는 "krw"
    productId: "product_123",
    productName: "프리미엄 멤버십",
    userId: "user_123", // 선택사항 (인증된 사용자 ID 자동 사용)
  }),
});

const data = await response.json();
// { success: true, sessionId: "...", url: "...", provider: "stripe" }
```

### 결제 상태 확인

```typescript
// GET /api/payments?session_id=xxx&provider=stripe
const response = await fetch(
  `/api/payments?session_id=${sessionId}&provider=stripe`
);
const data = await response.json();
// { success: true, status: "paid", provider: "stripe", ... }
```

## Stripe 설정

1. [Stripe Dashboard](https://dashboard.stripe.com/) 접속
2. API Keys 섹션에서 Secret Key 복사
3. 환경 변수에 추가
4. Webhook 설정 (선택사항)

## Toss Payments 설정

1. [Toss Payments Console](https://developers.tosspayments.com/) 접속
2. 테스트 모드 활성화
3. Secret Key와 Client Key 복사
4. 환경 변수에 추가

## 보안 주의사항

- Secret Key는 절대 클라이언트에 노출하지 마세요
- 모든 결제 요청은 서버에서 검증하세요
- Webhook을 사용하여 결제 상태를 확인하세요
