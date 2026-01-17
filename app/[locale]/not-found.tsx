import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#161b26] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-[#5eead4]">404</h1>
        <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-400 mb-8">
          요청하신 페이지가 존재하지 않거나 접근 권한이 없습니다.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#5eead4] text-[#1e2433] font-semibold rounded-lg hover:bg-[#2dd4bf] transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
