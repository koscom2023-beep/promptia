"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, LogOut, Home } from "lucide-react";

export function AdminHeader() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="border-b border-gray-800 bg-[#1e2433] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6 text-[#5eead4]" />
          <h1 className="text-xl font-bold text-white">관리자 대시보드</h1>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors rounded hover:bg-gray-800"
          >
            <Home className="w-4 h-4" />
            홈으로
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
