// 관리자 그룹 레이아웃 - 넷플릭스 스타일 사이드바
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminSidebar } from "./_components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#161b26] text-white flex">
        {/* 넷플릭스 스타일 사이드바 */}
        <AdminSidebar />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
