import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/**
 * 결제 API Route
 * 보고서 6장: 수익화 시스템
 * 
 * 지원 결제 수단:
 * - Stripe (국제 결제)
 * - Toss Payments (국내 결제)
 */

// Stripe 초기화
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover" as any,
});

// getStripe 함수 (클라이언트용)
async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  return stripe;
}

/**
 * 결제 생성 (POST /api/payments)
 * 
 * Request Body:
 * {
 *   "provider": "stripe" | "toss",
 *   "amount": number,
 *   "currency": "usd" | "krw",
 *   "productId": string,
 *   "productName": string,
 *   "userId": string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { provider, amount, currency, productId, productName, userId } = body;

    // 입력 검증
    if (!provider || !amount || !currency || !productId || !productName) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
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

    // 결제 제공자별 처리
    if (provider === "stripe") {
      return await handleStripePayment({
        amount,
        currency,
        productId,
        productName,
        userId: userId || user.id,
      });
    } else if (provider === "toss") {
      return await handleTossPayment({
        amount,
        currency,
        productId,
        productName,
        userId: userId || user.id,
      });
    } else {
      return NextResponse.json(
        { error: "지원하지 않는 결제 제공자입니다." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("결제 처리 오류:", error);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * Stripe 결제 처리
 */
async function handleStripePayment({
  amount,
  currency,
  productId,
  productName,
  userId,
}: {
  amount: number;
  currency: string;
  productId: string;
  productName: string;
  userId: string;
}) {
  try {
    const stripeInstance = await getStripe();
    if (!stripeInstance) {
      return NextResponse.json(
        { error: "Stripe 설정이 완료되지 않았습니다." },
        { status: 500 }
      );
    }

    // Stripe 결제 세션 생성
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: productName,
            },
            unit_amount: amount * 100, // 센트 단위로 변환
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments/cancel`,
      metadata: {
        productId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      provider: "stripe",
    });
  } catch (error: any) {
    console.error("Stripe 결제 세션 생성 실패:", error);
    return NextResponse.json(
      { error: `Stripe 오류: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Toss Payments 결제 처리
 */
async function handleTossPayment({
  amount,
  currency,
  productId,
  productName,
  userId,
}: {
  amount: number;
  currency: string;
  productId: string;
  productName: string;
  userId: string;
}) {
  try {
    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
    const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!TOSS_SECRET_KEY || !TOSS_CLIENT_KEY) {
      return NextResponse.json(
        { error: "Toss Payments 설정이 완료되지 않았습니다." },
        { status: 500 }
      );
    }

    // Toss Payments 결제 요청 생성
    const response = await fetch("https://api.tosspayments.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency.toUpperCase(),
        orderId: `order_${productId}_${Date.now()}`,
        orderName: productName,
        successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payments/success`,
        failUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payments/fail`,
        customer: {
          userId: userId,
        },
        metadata: {
          productId,
          userId,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Toss Payments 요청 실패");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      paymentKey: data.paymentKey,
      url: data.checkoutUrl,
      provider: "toss",
    });
  } catch (error: any) {
    console.error("Toss Payments 결제 요청 실패:", error);
    return NextResponse.json(
      { error: `Toss Payments 오류: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * 결제 상태 확인 (GET /api/payments?session_id=xxx)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const provider = searchParams.get("provider") || "stripe";

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (provider === "stripe") {
      const stripeInstance = await getStripe();
      if (!stripeInstance) {
        return NextResponse.json(
          { error: "Stripe 설정이 완료되지 않았습니다." },
          { status: 500 }
        );
      }
      const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
      return NextResponse.json({
        success: true,
        status: session.payment_status,
        provider: "stripe",
        session,
      });
    } else if (provider === "toss") {
      // Toss Payments 결제 상태 확인
      const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
      if (!TOSS_SECRET_KEY) {
        return NextResponse.json(
          { error: "Toss Payments 설정이 완료되지 않았습니다." },
          { status: 500 }
        );
      }

      const response = await fetch(
        `https://api.tosspayments.com/v1/payments/${sessionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Toss Payments 상태 확인 실패");
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        status: data.status,
        provider: "toss",
        payment: data,
      });
    } else {
      return NextResponse.json(
        { error: "지원하지 않는 결제 제공자입니다." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("결제 상태 확인 오류:", error);
    return NextResponse.json(
      { error: `결제 상태 확인 실패: ${error.message}` },
      { status: 500 }
    );
  }
}
