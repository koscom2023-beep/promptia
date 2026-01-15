"use client";

export function Footer() {
  const handleLinkClick = (message: string) => {
    alert(message);
  };

  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-400 mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* 링크 섹션 */}
        <div className="flex flex-wrap gap-6 mb-6">
          <button
            type="button"
            className="hover:text-white transition-colors text-left"
            onClick={() => handleLinkClick("이용약관 페이지 준비 중입니다.")}
          >
            이용약관
          </button>
          <button
            type="button"
            className="hover:text-white transition-colors text-left"
            onClick={() => handleLinkClick("개인정보처리방침 페이지 준비 중입니다.")}
          >
            개인정보처리방침
          </button>
          <button
            type="button"
            className="hover:text-white transition-colors text-left"
            onClick={() => handleLinkClick("고객센터 페이지 준비 중입니다.")}
          >
            고객센터
          </button>
        </div>

        {/* 법적 고지 */}
        <div className="mb-6 text-sm leading-relaxed">
          <p className="mb-2">
            본 서비스의 모든 콘텐츠는 AI 및 사용자에 의해 생성되었으며, 플랫폼은 이에 대한 법적 책임을 지지 않습니다. 모든 창작물에 대한 책임은 업로드한 사용자에게 있으며, 저작권 침해 신고 시 운영 정책에 따라 삭제될 수 있습니다.
          </p>
        </div>

        {/* 카피라이트 */}
        <div className="text-xs italic text-gray-500">
          © 2026 Promptia Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
