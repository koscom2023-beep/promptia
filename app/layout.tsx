import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

export const metadata: Metadata = {
  title: {
    default: "프롬프티아 (Promptia)",
    template: "%s | 프롬프티아",
  },
  description: "독자와 AI 창작자들의 해방구 - 프롬프티아에서 AI로 만든 웹소설과 웹툰을 만나보세요",
  keywords: ["프롬프티아", "Promptia", "웹소설", "웹툰", "AI", "창작", "소설", "만화", "프롬프트"],
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
    title: "프롬프티아 (Promptia)",
    description: "독자와 AI 창작자들의 해방구 - 프롬프티아에서 AI로 만든 웹소설과 웹툰을 만나보세요",
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
    title: "프롬프티아 (Promptia)",
    description: "독자와 AI 창작자들의 해방구 - 프롬프티아에서 AI로 만든 웹소설과 웹툰을 만나보세요",
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
      <body>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
