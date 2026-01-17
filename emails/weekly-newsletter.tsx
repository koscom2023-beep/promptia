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

interface WeeklyNewsletterEmailProps {
  week?: string;
  topWorks?: Array<{
    id: string;
    title: string;
    author: string;
    thumbnailUrl?: string;
    description?: string;
    viewCount?: number;
    voteCount?: number;
  }>;
  siteUrl?: string;
}

export const WeeklyNewsletterEmail = ({
  week = "2024년 1월 첫째 주",
  topWorks = [
    {
      id: "1",
      title: "재벌집 막내 AI",
      author: "프롬프티아",
      description: "재벌가 막내아들의 몸에 AI가 빙의했다.",
      viewCount: 3400,
      voteCount: 1200,
    },
    {
      id: "2",
      title: "회귀했더니 AI가 내 비서?",
      author: "프롬프티아",
      description: "망한 개발자, 10년 전으로 돌아가다.",
      viewCount: 1200,
      voteCount: 450,
    },
    {
      id: "3",
      title: "사이버펑크 조선",
      author: "프롬프티아",
      description: "네온 사인 아래 한양의 밤.",
      viewCount: 890,
      voteCount: 320,
    },
  ],
  siteUrl = "https://promptia.com",
}: WeeklyNewsletterEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>📚 {week} 베스트 작품을 만나보세요!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* 헤더 */}
          <Section style={header}>
            <Heading style={h1}>📚 주간 베스트 작품</Heading>
            <Text style={subtitle}>{week}</Text>
          </Section>

          {/* 본문 */}
          <Section style={content}>
            <Text style={text}>
              안녕하세요, 프롬프티아입니다!
            </Text>
            <Text style={text}>
              이번 주 가장 인기 있었던 작품들을 소개합니다. 놓치지 마세요!
            </Text>

            {/* 베스트 작품 목록 */}
            {topWorks.map((work, index) => (
              <Section key={work.id} style={workCard}>
                {/* 순위 배지 */}
                <Section style={rankBadge}>
                  <Text style={rankText}>{index + 1}</Text>
                </Section>

                {/* 작품 정보 */}
                <Section style={workInfo}>
                  <Heading style={workTitle}>{work.title}</Heading>
                  <Text style={workAuthor}>작가: {work.author}</Text>
                  {work.description && (
                    <Text style={workDescription}>{work.description}</Text>
                  )}
                  <Section style={workStats}>
                    <Text style={statText}>👁️ {work.viewCount?.toLocaleString() || 0}</Text>
                    <Text style={statText}>❤️ {work.voteCount?.toLocaleString() || 0}</Text>
                  </Section>
                  <Link href={`${siteUrl}/novels/${work.id}`} style={readButton}>
                    읽어보기 →
                  </Link>
                </Section>
              </Section>
            ))}

            {/* CTA 버튼 */}
            <Section style={buttonSection}>
              <Link href={`${siteUrl}`} style={button}>
                더 많은 작품 보기
              </Link>
            </Section>

            {/* 푸터 */}
            <Section style={footer}>
              <Text style={footerText}>
                매주 월요일, 베스트 작품을 이메일로 받아보세요.
                <br />
                <Link href={`${siteUrl}/settings/notifications`} style={footerLink}>
                  알림 설정 변경
                </Link>
              </Text>
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

export default WeeklyNewsletterEmail;

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
  margin: "0 0 8px",
};

const subtitle = {
  color: "#f1f5f9",
  fontSize: "14px",
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

const workCard = {
  backgroundColor: "#1e293b",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  display: "flex",
  gap: "16px",
};

const rankBadge = {
  backgroundColor: "#e50914",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const rankText = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const workInfo = {
  flex: 1,
};

const workTitle = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const workAuthor = {
  color: "#94a3b8",
  fontSize: "14px",
  margin: "0 0 8px",
};

const workDescription = {
  color: "#cbd5e1",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 12px",
};

const workStats = {
  display: "flex",
  gap: "16px",
  margin: "0 0 12px",
};

const statText = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "0",
};

const readButton = {
  color: "#5eead4",
  fontSize: "14px",
  textDecoration: "none",
  fontWeight: "bold",
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
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const footerLink = {
  color: "#5eead4",
  textDecoration: "underline",
};
