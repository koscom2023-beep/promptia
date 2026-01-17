// 인증 그룹 레이아웃
// 로그인/회원가입 페이지용

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#161b26] text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
