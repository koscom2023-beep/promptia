"use client";

import { Cpu, Sparkles, Target, Globe, Calendar, User } from "lucide-react";

interface TechnicalMetadataProps {
  /**
   * 사용된 AI 모델 (예: GPT-4, DALL-E 3, Midjourney 등)
   */
  aiModel?: string | null;
  /**
   * 프롬프트 (사용된 프롬프트 텍스트)
   */
  promptUsed?: string | null;
  /**
   * 생성 의도 (작품을 만들게 된 의도)
   */
  creationIntent?: string | null;
  /**
   * 세계관 설명
   */
  worldviewDescription?: string | null;
  /**
   * 시드 값 (재현 가능성을 위한 시드)
   */
  seed?: number | null;
  /**
   * 스텝 수 (이미지 생성 시 사용)
   */
  steps?: number | null;
  /**
   * CFG 스케일 (이미지 생성 시 사용)
   */
  cfgScale?: number | null;
  /**
   * 생성 날짜
   */
  createdAt?: string | null;
  /**
   * 작가 정보
   */
  author?: string | null;
}

/**
 * 기술적 메타데이터 표시 컴포넌트
 * 
 * 작품 상세 페이지 하단에 AI 생성 정보를 표시하여
 * 정보성 콘텐츠로서의 가치를 높이고 SEO를 개선합니다.
 */
export function TechnicalMetadata({
  aiModel,
  promptUsed,
  creationIntent,
  worldviewDescription,
  seed,
  steps,
  cfgScale,
  createdAt,
  author,
}: TechnicalMetadataProps) {
  // 모든 메타데이터가 없으면 표시하지 않음
  const hasAnyMetadata =
    aiModel ||
    promptUsed ||
    creationIntent ||
    worldviewDescription ||
    seed !== null ||
    steps !== null ||
    cfgScale !== null;

  if (!hasAnyMetadata) {
    return null;
  }

  return (
    <div className="bg-[#252d3d] rounded-lg p-6 border border-gray-800 mt-8">
      <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <Cpu className="w-5 h-5 text-[#5eead4]" />
        생성 정보
      </h3>

      <div className="space-y-4">
        {/* AI 모델 */}
        {aiModel && (
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#5eead4] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">사용된 AI 모델</p>
              <p className="text-white">{aiModel}</p>
            </div>
          </div>
        )}

        {/* 프롬프트 */}
        {promptUsed && (
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-[#5eead4] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">프롬프트</p>
              <p className="text-white whitespace-pre-wrap bg-[#1e2433] p-3 rounded border border-gray-700 font-mono text-sm">
                {promptUsed}
              </p>
            </div>
          </div>
        )}

        {/* 생성 의도 */}
        {creationIntent && (
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-[#5eead4] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">생성 의도</p>
              <p className="text-white">{creationIntent}</p>
            </div>
          </div>
        )}

        {/* 세계관 설명 */}
        {worldviewDescription && (
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-[#5eead4] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">세계관 설명</p>
              <p className="text-white whitespace-pre-wrap">{worldviewDescription}</p>
            </div>
          </div>
        )}

        {/* 기술적 파라미터 */}
        {(seed !== null || steps !== null || cfgScale !== null) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            {seed !== null && (
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">시드 (Seed)</p>
                <p className="text-white font-mono">{seed}</p>
              </div>
            )}
            {steps !== null && (
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">스텝 수 (Steps)</p>
                <p className="text-white font-mono">{steps}</p>
              </div>
            )}
            {cfgScale !== null && (
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">CFG 스케일</p>
                <p className="text-white font-mono">{cfgScale}</p>
              </div>
            )}
          </div>
        )}

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
          {author && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>작가: {author}</span>
            </div>
          )}
          {createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>생성일: {new Date(createdAt).toLocaleDateString("ko-KR")}</span>
            </div>
          )}
        </div>
      </div>

      {/* 법적 고지 */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 leading-relaxed">
          본 작품은 AI를 활용하여 생성되었습니다. 생성 과정에서 사용된 프롬프트와 기술적 파라미터는
          재현 가능성을 위해 공개되었으며, 이는 AI 생성 콘텐츠의 투명성과 연구 목적을 위한 것입니다.
        </p>
      </div>
    </div>
  );
}
