# 관리자 대시보드 설정 가이드

## 개요

프롬프티아 관리자 대시보드는 플랫폼의 통제 센터로, 작품 모더레이션, 사용자 관리, 통계 조회 등의 기능을 제공합니다.

## 주요 기능

### 1. 보안 미들웨어
- `/admin` 경로 접근 시 자동으로 관리자 권한 확인
- 권한이 없으면 404 페이지로 리라이트
- Supabase Auth의 `user_metadata.role` 또는 `app_metadata.role`을 확인

### 2. 데이터 테이블 (TanStack Table)
- 작품 목록: 페이지네이션, 필터링, 정렬 지원
- 사용자 목록: 페이지네이션 지원
- 실시간 검색 및 필터링

### 3. AI 모더레이션 큐
- 작품 상태 관리: Pending / Approved / Rejected
- 일괄 승인/거부 기능
- 상태별 필터링

### 4. 시스템 지표 (Recharts)
- 일일 투표 수 추이 (최근 7일)
- 일일 신규 가입자 추이 (최근 7일)
- 대시보드 통계 카드

## 설정 방법

### 1. 관리자 권한 부여

Supabase Dashboard에서 사용자에게 관리자 권한을 부여해야 합니다.

#### 방법 1: Supabase Dashboard에서 직접 설정

1. Supabase Dashboard → Authentication → Users
2. 관리자로 설정할 사용자 선택
3. User Metadata 또는 App Metadata에 `role: "admin"` 추가

```json
{
  "role": "admin"
}
```

#### 방법 2: SQL로 설정

```sql
-- 특정 사용자의 role을 admin으로 설정
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

#### 방법 3: Supabase Client로 설정 (서버 사이드)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role Key 필요
);

// 사용자 메타데이터 업데이트
await supabase.auth.admin.updateUserById(
  userId,
  {
    app_metadata: { role: 'admin' }
  }
);
```

### 2. 환경 변수 확인

다음 환경 변수가 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 404 페이지 생성 (선택사항)

권한이 없는 사용자가 `/admin` 경로에 접근하면 404 페이지로 리라이트됩니다.
기본 Next.js 404 페이지를 사용하거나, 커스텀 404 페이지를 생성할 수 있습니다:

```typescript
// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#161b26] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400">페이지를 찾을 수 없습니다.</p>
      </div>
    </div>
  );
}
```

## 사용 방법

### 관리자 대시보드 접근

1. 관리자 권한이 있는 계정으로 로그인
2. `/admin/dashboard` 경로로 접근
3. 미들웨어가 자동으로 권한을 확인하고 접근 허용/거부

### 작품 모더레이션

1. "AI 모더레이션 큐" 섹션에서 대기 중인 작품 확인
2. "승인" 또는 "거부" 버튼 클릭
3. 상태가 즉시 업데이트됨

### 작품 목록 관리

1. "작품 목록" 테이블에서 모든 작품 확인
2. 검색, 필터링, 정렬 기능 사용
3. 페이지네이션으로 많은 작품 탐색

### 통계 확인

1. "통계 카드"에서 주요 지표 확인
2. "차트 섹션"에서 일일 추이 확인
3. 최근 7일간의 데이터를 그래프로 확인

## 보안 고려사항

### 1. 미들웨어 보안
- 모든 `/admin` 경로는 미들웨어에서 자동으로 보호됩니다
- 권한이 없으면 404 페이지로 리라이트되어 존재 여부를 숨깁니다

### 2. Server Actions 보안
- 모든 Server Action은 `checkAdminRole()` 함수로 권한을 확인합니다
- 클라이언트 사이드 검증만으로는 충분하지 않으므로 서버 사이드 검증이 필수입니다

### 3. 권한 관리
- 관리자 권한은 Supabase Auth의 메타데이터에 저장됩니다
- Service Role Key를 사용하여 관리자 권한을 부여할 수 있습니다

## 문제 해결

### 관리자 권한이 인식되지 않음

1. Supabase Dashboard에서 사용자 메타데이터 확인
2. `role: "admin"`이 올바르게 설정되어 있는지 확인
3. 브라우저 캐시 및 쿠키 삭제 후 재로그인

### 404 페이지로 리다이렉트됨

1. 사용자 권한 확인
2. 미들웨어 로그 확인 (개발 환경)
3. Supabase Auth 세션 확인

### 데이터가 표시되지 않음

1. Supabase 데이터베이스 연결 확인
2. RLS (Row Level Security) 정책 확인
3. 네트워크 탭에서 API 요청 확인

## 향후 개선 사항

### 1. 작품 상태 컬럼 추가
현재는 `is_blocked` 컬럼을 사용하지만, 추후 `status` 컬럼을 추가하여 더 세밀한 상태 관리가 가능합니다:

```sql
ALTER TABLE novels
ADD COLUMN status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';
```

### 2. 사용자 테이블 생성
현재는 `novels` 테이블의 `author_id`를 기반으로 사용자 정보를 추론하지만, 별도의 `users` 테이블을 생성하면 더 정확한 사용자 관리가 가능합니다.

### 3. 상세 통계
- 시간대별 통계
- 카테고리별 통계
- 사용자별 활동 통계

## 참고 자료

- [TanStack Table 문서](https://tanstack.com/table/latest)
- [Recharts 문서](https://recharts.org/)
- [Next.js Middleware 문서](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
