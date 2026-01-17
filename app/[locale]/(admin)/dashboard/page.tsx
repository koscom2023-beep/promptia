import { redirect } from "next/navigation";
import { checkAdminRole, getDashboardStats } from "@/app/actions/admin-dashboard";
import { AdminHeader } from "./_components/AdminHeader";
import { StatsCards } from "./_components/StatsCards";
import { ModerationQueue } from "./_components/ModerationQueue";
import { WorksTable } from "./_components/WorksTable";
import { UsersTable } from "./_components/UsersTable";
import { ChartsSection } from "./_components/ChartsSection";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ 
  params 
}: { 
  params: { locale: string } 
}) {
  // 관리자 권한 확인
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    redirect(`/${params.locale}/login?error=unauthorized`);
  }

  // 대시보드 통계 가져오기
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-[#161b26] text-white p-8">
      {/* 대시보드 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
        <p className="text-gray-400">플랫폼 통계 및 콘텐츠 관리</p>
      </div>
      
      <div className="space-y-8">
        {/* 통계 카드 */}
        <StatsCards stats={stats} />

        {/* 모더레이션 큐 (신고 처리) */}
        <div>
          <h2 className="text-2xl font-bold mb-4">🚨 신고된 콘텐츠</h2>
          <ModerationQueue />
        </div>

        {/* 차트 섹션 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">📊 통계 분석</h2>
          <ChartsSection />
        </div>

        {/* 작품 목록 테이블 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">📚 작품 관리</h2>
          <WorksTable />
        </div>

        {/* 사용자 목록 테이블 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">👥 사용자 관리</h2>
          <UsersTable />
        </div>
      </div>
    </div>
  );
}
