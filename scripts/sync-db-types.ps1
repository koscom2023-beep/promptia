# Supabase 타입 동기화 스크립트 (PowerShell)
# 데이터베이스 스키마가 변경되면 이 스크립트를 실행하여 타입 정의를 최신화하세요

# 환경 변수 확인
if (-not $env:SUPABASE_PROJECT_ID) {
  Write-Host "❌ 오류: SUPABASE_PROJECT_ID 환경 변수가 설정되지 않았습니다." -ForegroundColor Red
  Write-Host "사용법: `$env:SUPABASE_PROJECT_ID='your-project-id'; npm run sync-types" -ForegroundColor Yellow
  exit 1
}

# Supabase CLI 설치 확인
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
  Write-Host "❌ 오류: Supabase CLI가 설치되지 않았습니다." -ForegroundColor Red
  Write-Host "설치 방법: npm install -g supabase" -ForegroundColor Yellow
  exit 1
}

Write-Host "🔄 Supabase 타입 동기화 시작..." -ForegroundColor Cyan

# types 디렉토리 생성 (없는 경우)
if (-not (Test-Path "types")) {
  New-Item -ItemType Directory -Path "types" | Out-Null
}

# 타입 생성
supabase gen types typescript `
  --project-id $env:SUPABASE_PROJECT_ID `
  --schema public `
  | Out-File -FilePath "types/supabase.ts" -Encoding utf8

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ 타입 동기화 완료: types/supabase.ts" -ForegroundColor Green
} else {
  Write-Host "❌ 타입 동기화 실패" -ForegroundColor Red
  exit 1
}
