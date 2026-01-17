#!/bin/bash

# Supabase 타입 동기화 스크립트
# 데이터베이스 스키마가 변경되면 이 스크립트를 실행하여 타입 정의를 최신화하세요

# 환경 변수 확인
if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "❌ 오류: SUPABASE_PROJECT_ID 환경 변수가 설정되지 않았습니다."
  echo "사용법: SUPABASE_PROJECT_ID=your-project-id npm run sync-types"
  exit 1
fi

# Supabase CLI 설치 확인
if ! command -v supabase &> /dev/null; then
  echo "❌ 오류: Supabase CLI가 설치되지 않았습니다."
  echo "설치 방법: npm install -g supabase"
  exit 1
fi

echo "🔄 Supabase 타입 동기화 시작..."

# 타입 생성
supabase gen types typescript \
  --project-id "$SUPABASE_PROJECT_ID" \
  --schema public \
  > types/supabase.ts

if [ $? -eq 0 ]; then
  echo "✅ 타입 동기화 완료: types/supabase.ts"
else
  echo "❌ 타입 동기화 실패"
  exit 1
fi
