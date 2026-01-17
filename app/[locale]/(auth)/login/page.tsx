"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    const result = await signIn(formData);
    
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
    <div className="min-h-screen flex items-center justify-center bg-[#161b26] px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#5eead4] mb-2">프롬프티아</h1>
          <p className="text-gray-400">AI 창작 플랫폼</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-[#1e2433] rounded-lg p-8 shadow-xl border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">로그인</h2>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                이메일
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
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-[#161b26] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5eead4] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#5eead4] hover:bg-[#2dd4bf] text-[#1e2433] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              계정이 없으신가요?{" "}
              <Link href="/ko/signup" className="text-[#5eead4] hover:underline font-medium">
                회원가입
              </Link>
            </p>
          </div>

          {/* 비밀번호 찾기 */}
          <div className="mt-4 text-center">
            <Link href="/ko/forgot-password" className="text-sm text-gray-500 hover:text-gray-400">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>

        {/* 소셜 로그인 (선택사항) */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>또는 소셜 계정으로 로그인</p>
          <div className="mt-4 flex gap-4 justify-center">
            {/* Google, GitHub 등 소셜 로그인 버튼 추가 가능 */}
          </div>
        </div>
      </div>
    </div>
  );
}
