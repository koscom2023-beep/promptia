"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { LayoutDashboard, FileText, Users, Flag, BarChart3, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const locale = useLocale();
  const pathname = usePathname();

  const navItems = [
    { href: `/${locale}/dashboard`, icon: <LayoutDashboard className="w-5 h-5" />, label: "대시보드" },
    { href: `/${locale}/dashboard/works`, icon: <FileText className="w-5 h-5" />, label: "작품 관리" },
    { href: `/${locale}/dashboard/users`, icon: <Users className="w-5 h-5" />, label: "사용자 관리" },
    { href: `/${locale}/dashboard/reports`, icon: <Flag className="w-5 h-5" />, label: "신고 관리" },
    { href: `/${locale}/dashboard/analytics`, icon: <BarChart3 className="w-5 h-5" />, label: "통계 분석" },
    { href: `/${locale}/dashboard/settings`, icon: <Settings className="w-5 h-5" />, label: "설정" },
  ];

  return (
    <aside className="w-64 bg-black/50 border-r border-gray-800 flex flex-col min-h-screen">
      {/* 로고 */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-[#5eead4]">프롬프티아</h1>
        <p className="text-sm text-gray-400">관리자 대시보드</p>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
                isActive
                  ? "bg-[#5eead4]/10 text-[#5eead4]"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <span className={isActive ? "text-[#5eead4]" : "text-gray-400 group-hover:text-[#5eead4]"}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 */}
      <div className="p-4 border-t border-gray-800">
        <Link 
          href={`/${locale}`}
          className="block text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← 메인으로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
