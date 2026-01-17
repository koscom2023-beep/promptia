import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  const title = locale === "ko" ? "이용약관" : "Terms of Service";
  const description = locale === "ko" 
    ? "프롬프티아 서비스 이용약관 - AI 창작물 공유 플랫폼의 이용 규정"
    : "Promptia Terms of Service - Rules for using our AI creation platform";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/legal/terms`,
      languages: {
        'ko': `${siteUrl}/ko/legal/terms`,
        'en': `${siteUrl}/en/legal/terms`,
      },
    },
    openGraph: {
      title,
      description,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-white">이용약관</h1>
      <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
        
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">제1조 (목적)</h2>
          <p>
            본 약관은 프롬프티아(Promptia, 이하 "플랫폼")가 제공하는 AI 창작물 공유 및 투표 서비스의 이용과 관련하여 
            플랫폼과 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">제2조 (정의)</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>"플랫폼"이란 AI로 생성된 소설, 웹툰, 영상 등의 창작물을 공유하고 투표할 수 있는 서비스를 말합니다.</li>
            <li>"이용자"란 본 약관에 따라 플랫폼이 제공하는 서비스를 받는 자를 말합니다.</li>
            <li>"AI 창작물"이란 AI 기술을 활용하여 생성된 텍스트, 이미지, 영상 등의 콘텐츠를 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">제3조 (저작권 및 책임)</h2>
          <p className="mb-4">
            1. 플랫폼에 업로드된 모든 AI 창작물에 대한 저작권 및 법적 책임은 해당 콘텐츠를 업로드한 이용자에게 있습니다.
          </p>
          <p className="mb-4">
            2. 플랫폼은 이용자가 업로드한 콘텐츠의 적법성, 정확성, 안전성에 대해 책임을 지지 않습니다.
          </p>
          <p>
            3. 저작권 침해, 명예훼손, 기타 법률 위반이 의심되는 콘텐츠는 신고 접수 시 운영 정책에 따라 삭제될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">제4조 (AI 생성 콘텐츠에 대한 고지)</h2>
          <p>
            본 플랫폼의 모든 콘텐츠는 AI에 의해 생성되었으며, 사실 관계의 정확성이나 법적 효력을 보증하지 않습니다. 
            이용자는 이를 충분히 인지하고 서비스를 이용해야 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">제5조 (서비스 이용)</h2>
          <p>
            이용자는 관련 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 
            플랫폼이 통지하는 사항 등을 준수하여야 하며, 기타 플랫폼의 업무에 방해되는 행위를 해서는 안 됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">제6조 (개인정보 보호)</h2>
          <p>
            플랫폼은 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 별도로 운영합니다. 
            자세한 사항은 <a href="/ko/legal/privacy" className="text-[#5eead4] hover:underline">개인정보처리방침</a>을 참조하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">제7조 (면책 조항)</h2>
          <p>
            플랫폼은 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 
            서비스 제공에 관한 책임이 면제됩니다.
          </p>
        </section>

        <div className="border-t border-gray-700 pt-6 mt-8 text-sm text-gray-400">
          <p>최종 수정일: 2026년 1월</p>
          <p>문의: support@promptia.com</p>
        </div>
      </div>
    </div>
  );
}
