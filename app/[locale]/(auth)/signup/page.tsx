"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/actions/auth";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    const result = await signUp(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // 성공 시 홈으로 리다이렉트
      router.push("/ko");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161b26] px-4 py-12">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#5eead4] mb-2">프롬프티아</h1>
          <p className="text-gray-400">AI 창작 플랫폼에 오신 것을 환영합니다</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-[#1e2433] rounded-lg p-8 shadow-xl border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">회원가입</h2>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                이름 (선택사항)
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                className="w-full px-4 py-3 bg-[#161b26] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5eead4] focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                이메일 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-[#161b26] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5eead4] focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full px-4 py-3 bg-[#161b26] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5eead4] focus:border-transparent"
                placeholder="6자 이상"
              />
              <p className="mt-1 text-xs text-gray-500">최소 6자 이상 입력해주세요</p>
            </div>

            {/* 약관 동의 */}
            <div className="flex items-start gap-2 pt-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-1 w-4 h-4 text-[#5eead4] bg-[#161b26] border-gray-700 rounded focus:ring-[#5eead4]"
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                <Link href="/ko/legal/terms" className="text-[#5eead4] hover:underline">
                  이용약관
                </Link>
                {" "}및{" "}
                <Link href="/ko/legal/privacy" className="text-[#5eead4] hover:underline">
                  개인정보처리방침
                </Link>
                에 동의합니다 *
              </label>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#5eead4] hover:bg-[#2dd4bf] text-[#1e2433] font-semibold rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "가입 처리 중..." : "가입하기"}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              이미 계정이 있으신가요?{" "}
              <Link href="/ko/login" className="text-[#5eead4] hover:underline font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>회원가입 시 자동으로 프로필이 생성되며,</p>
          <p>AI 창작물 업로드 및 투표 기능을 이용할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}
