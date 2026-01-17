import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { ContestResultEmail } from "@/emails/contest-result";
import { WeeklyNewsletterEmail } from "@/emails/weekly-newsletter";
import { render } from "@react-email/render";

/**
 * 이메일 전송 API
 * 보고서 7장: 마케팅 자동화 - 이메일
 * 
 * Resend를 사용하여 이메일을 전송합니다.
 */

// Resend 초기화
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 이메일 전송 (POST /api/email/send)
 * 
 * Request Body:
 * {
 *   "type": "contest-result" | "weekly-newsletter",
 *   "to": string | string[],
 *   "subject": string (optional),
 *   "data": object (템플릿별 데이터)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, subject, data } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: "type과 to가 필요합니다." },
        { status: 400 }
      );
    }

    // 발신자 이메일
    const from = process.env.RESEND_FROM_EMAIL || "프롬프티아 <noreply@promptia.com>";

    let emailHtml: string;
    let emailSubject: string;

    // 템플릿별 처리
    switch (type) {
      case "contest-result":
        emailHtml = await render(
          ContestResultEmail({
            winnerName: data?.winnerName,
            winnerTitle: data?.winnerTitle,
            contestName: data?.contestName,
            rank: data?.rank,
            prize: data?.prize,
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
          })
        );
        emailSubject = subject || `🎉 ${data?.contestName || "콘테스트"} 결과 발표!`;
        break;

      case "weekly-newsletter":
        emailHtml = await render(
          WeeklyNewsletterEmail({
            week: data?.week,
            topWorks: data?.topWorks,
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
          })
        );
        emailSubject = subject || `📚 ${data?.week || "주간"} 베스트 작품`;
        break;

      default:
        return NextResponse.json(
          { error: "지원하지 않는 이메일 타입입니다." },
          { status: 400 }
        );
    }

    // 이메일 전송
    const { data: emailData, error: emailError } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("이메일 전송 실패:", emailError);
      return NextResponse.json(
        { error: "이메일 전송 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: emailData?.id,
    });
  } catch (error: any) {
    console.error("이메일 전송 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
