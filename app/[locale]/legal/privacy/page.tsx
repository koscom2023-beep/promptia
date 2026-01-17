import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";
  const title = locale === "ko" ? "개인정보처리방침" : "Privacy Policy";
  const description = locale === "ko"
    ? "프롬프티아 개인정보처리방침 - 사용자 정보 보호 및 처리 방침"
    : "Promptia Privacy Policy - User data protection and processing policy";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/legal/privacy`,
      languages: {
        'ko': `${siteUrl}/ko/legal/privacy`,
        'en': `${siteUrl}/en/legal/privacy`,
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

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-white">개인정보처리방침</h1>
      <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
        
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            프롬프티아는 다음의 목적을 위하여 개인정보를 처리합니다. 
            처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 
            이용 목적이 변경될 시에는 사전 동의를 구할 것입니다.
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>회원 가입 및 관리</li>
            <li>서비스 제공 및 콘텐츠 관리</li>
            <li>마케팅 및 광고 활용 (선택사항)</li>
            <li>법적 분쟁 대응 및 감사 추적</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. 수집하는 개인정보 항목</h2>
          <p className="mb-4"><strong>필수 항목:</strong></p>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>이메일 주소</li>
            <li>비밀번호 (암호화 저장)</li>
          </ul>
          <p className="mb-4"><strong>자동 수집 항목:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>IP 주소 (투표 중복 방지)</li>
            <li>쿠키 및 세션 정보</li>
            <li>서비스 이용 기록</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 
            단, 관계 법령에 의하여 보존할 필요성이 있는 경우에는 해당 법령에서 정한 기간 동안 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. 개인정보의 제3자 제공</h2>
          <p>
            프롬프티아는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
            다만, 다음의 경우에는 예외로 합니다:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 
            가입 해지(동의 철회)를 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. 쿠키(Cookie)의 운용</h2>
          <p>
            플랫폼은 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키를 사용합니다. 
            쿠키는 웹사이트 운영에 이용되는 서버가 이용자의 브라우저에 전송하는 소량의 정보입니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">7. 개인정보 보호책임자</h2>
          <p>
            프롬프티아는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 
            개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p><strong>개인정보 보호책임자:</strong> 프롬프티아 운영팀</p>
            <p><strong>이메일:</strong> privacy@promptia.com</p>
          </div>
        </section>

        <div className="border-t border-gray-700 pt-6 mt-8 text-sm text-gray-400">
          <p>최종 수정일: 2026년 1월</p>
          <p>시행일: 2026년 1월</p>
        </div>
      </div>
    </div>
  );
}
