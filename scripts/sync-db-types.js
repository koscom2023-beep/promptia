#!/usr/bin/env node

/**
 * Supabase 타입 동기화 스크립트
 * 데이터베이스 스키마가 변경되면 이 스크립트를 실행하여 타입 정의를 최신화하세요
 * 
 * 사용법:
 *   SUPABASE_PROJECT_ID=your-project-id npm run sync-types
 * 
 * 또는 .env.local에 SUPABASE_PROJECT_ID를 설정:
 *   SUPABASE_PROJECT_ID=your-project-id
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 환경 변수 확인
const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error("❌ 오류: SUPABASE_PROJECT_ID 환경 변수가 설정되지 않았습니다.");
  console.error("사용법: SUPABASE_PROJECT_ID=your-project-id npm run sync-types");
  console.error("또는 .env.local 파일에 SUPABASE_PROJECT_ID를 추가하세요.");
  process.exit(1);
}

// Supabase CLI 설치 확인
try {
  execSync("supabase --version", { stdio: "ignore" });
} catch (error) {
  console.error("❌ 오류: Supabase CLI가 설치되지 않았습니다.");
  console.error("설치 방법: npm install -g supabase");
  process.exit(1);
}

console.log("🔄 Supabase 타입 동기화 시작...");
console.log(`프로젝트 ID: ${projectId}`);

// types 디렉토리 생성 (없는 경우)
const typesDir = path.join(process.cwd(), "types");
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
  console.log("📁 types 디렉토리 생성됨");
}

try {
  // 타입 생성
  const output = execSync(
    `supabase gen types typescript --project-id ${projectId} --schema public`,
    { encoding: "utf-8", stdio: "pipe" }
  );

  // 파일 저장
  const outputPath = path.join(typesDir, "supabase.ts");
  fs.writeFileSync(outputPath, output, "utf-8");

  console.log(`✅ 타입 동기화 완료: ${outputPath}`);
  console.log(`📊 생성된 타입 파일 크기: ${(output.length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error("❌ 타입 동기화 실패:");
  console.error(error.message);
  process.exit(1);
}
