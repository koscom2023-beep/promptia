/**
 * 랭킹 로딩 스켈레톤 컴포넌트
 * Suspense fallback으로 사용
 */

interface RankingSkeletonProps {
  title: string;
}

export function RankingSkeleton({ title }: RankingSkeletonProps) {
  return (
    <section className="px-4 py-12 md:px-8 bg-netflix-black">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="relative aspect-[2/3] bg-netflix-dark-secondary rounded-lg overflow-hidden animate-pulse"
          >
            {/* 썸네일 스켈레톤 */}
            <div className="absolute inset-0 bg-gradient-to-br from-netflix-dark-secondary via-netflix-dark-tertiary to-netflix-dark-secondary" />
            
            {/* 제목 스켈레톤 */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-netflix-black/90 to-transparent">
              <div className="h-4 bg-netflix-dark-tertiary rounded mb-2 w-3/4" />
              <div className="h-3 bg-netflix-dark-tertiary rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
