"use client"

import { useState, useEffect } from "react"
import { Search, User, Bookmark, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"

export function StickyHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-[#1e2433]/95 backdrop-blur-md shadow-lg shadow-black/10" : "bg-transparent",
      )}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#5eead4] to-[#2dd4bf] flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-[#1e2433]" />
            </div>
            <span className="text-xl font-bold text-white">프롬프티아</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-white hover:text-[#5eead4] transition">
              홈
            </Link>
            <Link href="/blog" className="text-sm text-slate-400 hover:text-white transition">
              가이드
            </Link>
            <Link href="/upload" className="text-sm text-slate-400 hover:text-white transition">
              업로드
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg transition" aria-label="검색">
              <Search className="w-5 h-5 text-slate-400" />
            </button>
            {loading ? (
              <div className="w-20 h-8 bg-gray-800 animate-pulse rounded"></div>
            ) : user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-gray-400">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 bg-[#5eead4] hover:bg-[#2dd4bf] text-[#1e2433] px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <User className="w-4 h-4" />
                로그인
              </Link>
            )}
            <button
              className="md:hidden p-2 hover:bg-white/5 rounded-lg transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="메뉴"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1e2433] border-t border-slate-700/50 px-4 py-4">
          <nav className="flex flex-col gap-1">
            <Link href="/" className="text-sm font-medium text-white py-3 px-2 rounded-lg hover:bg-white/5">
              홈
            </Link>
            <Link href="/blog" className="text-sm text-slate-400 py-3 px-2 rounded-lg hover:bg-white/5">
              가이드
            </Link>
            <Link href="/upload" className="text-sm text-slate-400 py-3 px-2 rounded-lg hover:bg-white/5">
              업로드
            </Link>
            {user ? (
              <>
                <span className="text-sm text-gray-400 py-3 px-2">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="mt-3 bg-[#5eead4] text-[#1e2433] py-2.5 rounded-lg text-sm font-semibold"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="mt-3 bg-[#5eead4] text-[#1e2433] py-2.5 rounded-lg text-sm font-semibold text-center"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
