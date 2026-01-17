import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ContestResultEmailProps {
  winnerName?: string;
  winnerTitle?: string;
  contestName?: string;
  rank?: number;
  prize?: string;
  siteUrl?: string;
}

export const ContestResultEmail = ({
  winnerName = "홍길동",
  winnerTitle = "재벌집 막내 AI",
  contestName = "2024 AI 창작 콘테스트",
  rank = 1,
  prize = "100만원",
  siteUrl = "https://promptia.com",
}: ContestResultEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🎉 {contestName} 결과 발표!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* 헤더 */}
          <Section style={header}>
            <Heading style={h1}>🎉 콘테스트 결과 발표</Heading>
          </Section>

          {/* 본문 */}
          <Section style={content}>
            <Text style={text}>
              안녕하세요, 프롬프티아입니다!
            </Text>
            <Text style={text}>
              <strong>{contestName}</strong>의 결과를 발표합니다.
            </Text>

            {/* 순위 정보 */}
            <Section style={rankSection}>
              <Text style={rankText}>
                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅"} {rank}위
              </Text>
              <Text style={winnerText}>
                <strong>{winnerName}</strong>님의 작품
              </Text>
              <Text style={titleText}>"{winnerTitle}"</Text>
            </Section>

            {/* 상금 정보 */}
            {prize && (
              <Section style={prizeSection}>
                <Text style={prizeLabel}>상금</Text>
                <Text style={prizeAmount}>{prize}</Text>
              </Section>
            )}

            {/* CTA 버튼 */}
            <Section style={buttonSection}>
              <Link href={`${siteUrl}/contests/results`} style={button}>
                결과 확인하기
              </Link>
            </Section>

            {/* 푸터 */}
            <Section style={footer}>
              <Text style={footerText}>
                감사합니다.
                <br />
                프롬프티아 팀
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ContestResultEmail;

// 스타일
const main = {
  backgroundColor: "#000000",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#0f172a",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#e50914",
  textAlign: "center" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "32px 24px",
};

const text = {
  color: "#ffffff",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const rankSection = {
  backgroundColor: "#1e293b",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const rankText = {
  color: "#fbbf24",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const winnerText = {
  color: "#ffffff",
  fontSize: "18px",
  margin: "0 0 8px",
};

const titleText = {
  color: "#94a3b8",
  fontSize: "16px",
  fontStyle: "italic",
  margin: "0",
};

const prizeSection = {
  backgroundColor: "#1e293b",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const prizeLabel = {
  color: "#94a3b8",
  fontSize: "14px",
  margin: "0 0 8px",
};

const prizeAmount = {
  color: "#5eead4",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#e50914",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  borderTop: "1px solid #334155",
  paddingTop: "24px",
  marginTop: "32px",
};

const footerText = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  textAlign: "center" as const,
};
