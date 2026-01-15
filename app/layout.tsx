import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

export const metadata: Metadata = {
  title: {
    default: "프롬프티아 - AI 창작 서바이벌",
    template: "%s | 프롬프티아",
  },
  description: "AI 소설, 웹툰, 영상 공모전 및 투표 플랫폼. 당신의 프롬프트가 작품이 되는 곳.",
  keywords: ["프롬프티아", "Promptia", "AI 창작", "웹소설", "웹툰", "영상", "공모전", "투표", "프롬프트", "AI 소설", "AI 웹툰"],
  authors: [{ name: "프롬프티아" }],
  creator: "프롬프티아",
  publisher: "프롬프티아",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "프롬프티아",
    title: "프롬프티아 - AI 창작 서바이벌",
    description: "AI 소설, 웹툰, 영상 공모전 및 투표 플랫폼. 당신의 프롬프트가 작품이 되는 곳.",
    images: [
      {
        url: `${siteUrl}/og-image-default.jpg`,
        width: 1200,
        height: 630,
        alt: "프롬프티아",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "프롬프티아 - AI 창작 서바이벌",
    description: "AI 소설, 웹툰, 영상 공모전 및 투표 플랫폼. 당신의 프롬프트가 작품이 되는 곳.",
    images: [`${siteUrl}/og-image-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
