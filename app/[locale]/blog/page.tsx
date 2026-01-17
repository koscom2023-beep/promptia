import Link from "next/link";
import { useLocale } from "next-intl";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "가이드 & 고객센터",
};

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8 text-white">프롬프티아 가이드</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 시작 가이드 */}
        <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">🚀 시작하기</h2>
          <p className="text-gray-300 mb-4">
            프롬프티아는 AI로 생성한 창작물을 공유하고 투표하는 플랫폼입니다.
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• 회원가입 없이도 작품 감상 가능</li>
            <li>• 작품 업로드는 로그인 필요</li>
            <li>• 투표는 IP당 1회 제한</li>
          </ul>
        </div>

        {/* 업로드 가이드 */}
        <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">📝 작품 업로드</h2>
          <p className="text-gray-300 mb-4">
            AI로 만든 소설, 웹툰, 영상을 업로드하세요.
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• 지원 형식: 텍스트, 이미지, 동영상</li>
            <li>• 최대 파일 크기: 100MB</li>
            <li>• 에피소드 단위 업로드 가능</li>
          </ul>
        </div>

        {/* 랭킹 시스템 */}
        <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">🏆 랭킹 시스템</h2>
          <p className="text-gray-300 mb-4">
            중력 기반 알고리즘으로 실시간 랭킹을 계산합니다.
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• 조회수 × 1점</li>
            <li>• 투표수 × 10점</li>
            <li>• 최신성 보너스 (최대 100점)</li>
          </ul>
        </div>

        {/* 법적 고지 */}
        <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">⚖️ 법적 안내</h2>
          <p className="text-gray-300 mb-4">
            저작권 및 법적 책임에 대한 중요 사항
          </p>
          <div className="space-y-2">
            <Link href="/ko/legal/terms" className="block text-[#5eead4] hover:underline">
              → 이용약관
            </Link>
            <Link href="/ko/legal/privacy" className="block text-[#5eead4] hover:underline">
              → 개인정보처리방침
            </Link>
          </div>
        </div>

        {/* 문의하기 */}
        <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">📧 문의하기</h2>
          <p className="text-gray-300 mb-4">
            서비스 이용 중 문의사항이 있으신가요?
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>이메일: support@promptia.com</p>
            <p>평일 09:00 - 18:00</p>
          </div>
        </div>

        {/* 신고하기 */}
        <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
          <h2 className="text-xl font-bold text-white mb-3">🚨 저작권 신고</h2>
          <p className="text-gray-300 mb-4">
            저작권 침해 콘텐츠를 발견하셨나요?
          </p>
          <p className="text-sm text-gray-400">
            각 작품 페이지의 "신고" 버튼을 통해 신고할 수 있습니다.
            신고 접수 후 24시간 이내 검토합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
