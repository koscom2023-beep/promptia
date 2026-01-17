"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

interface ModalPageProps {
  params: {
    id: string;
  };
}

export default function NovelModalPage({ params }: ModalPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 모달 닫기 - 인터셉팅 라우트에서는 이전 경로로 명시적으로 이동
  const handleClose = () => {
    // 인터셉팅 라우트에서 모달을 닫을 때는 이전 경로로 돌아감
    // router.back()이 작동하지 않을 수 있으므로, 홈 또는 이전 경로로 이동
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // 히스토리가 없으면 홈으로 이동
      router.push('/');
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // 작품 데이터 가져오기 (클라이언트 사이드)
  // 실제 구현 시에는 서버 컴포넌트로 데이터를 가져와야 합니다.
  // 여기서는 간단한 예시만 제공합니다.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#161b26] rounded-lg overflow-hidden">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* 모달 내용 */}
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <p className="text-white">작품 ID: {params.id}</p>
          <p className="text-gray-400 mt-2">
            여기에 작품 미리보기 내용이 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
