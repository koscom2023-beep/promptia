# 계층형 댓글 시스템 가이드

## 개요

프롬프티아의 계층형 댓글 시스템은 자기 참조 관계를 활용하여 대댓글을 지원하며, 사용자 평판 시스템과 연동되어 있습니다.

## 주요 기능

### 1. 계층형 댓글 구조
- 자기 참조 관계 (`parent_id`)를 사용한 대댓글 시스템
- 최대 3단계 깊이까지 지원
- 3단계 이상은 자동으로 평면화하여 표시

### 2. 재귀 쿼리
- `WITH RECURSIVE` 구문을 사용한 효율적인 대댓글 조회
- Supabase RPC 함수로 구현
- 폴백 로직 포함 (RPC 함수가 없는 경우 일반 쿼리 사용)

### 3. 평판 시스템
- 댓글 작성 시 자동으로 평판 점수 증가 (+5점)
- 점수에 따라 자동으로 뱃지 부여
- 뱃지 레벨: 초급(50+) → 중급(100+) → 고급(500+) → 베테랑(1000+) → 전문가(2000+) → 마스터(5000+) → 전설(10000+)

### 4. UI 컴포넌트
- 재귀적 컴포넌트 구조
- 깊이에 따른 들여쓰기
- 대댓글 작성 폼
- 뱃지 및 평판 점수 표시

## 설정 방법

### 1. 데이터베이스 스키마 업데이트

Supabase SQL Editor에서 `create_hierarchical_comments.sql` 파일의 내용을 실행하세요:

```sql
-- comments 테이블에 parent_id 컬럼 추가
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  reputation_score INTEGER DEFAULT 0,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 재귀 쿼리 함수 생성
CREATE OR REPLACE FUNCTION get_comments_with_replies(novel_id_param UUID)
RETURNS TABLE (...) AS $$
  -- WITH RECURSIVE 쿼리
$$ LANGUAGE plpgsql;
```

### 2. 환경 변수 확인

다음 환경 변수가 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 사용 방법

### 댓글 작성

```typescript
import { createComment } from "@/app/actions/comments-hierarchical";

// 루트 댓글 작성
await createComment(novelId, "닉네임", "댓글 내용", null);

// 대댓글 작성
await createComment(novelId, "닉네임", "대댓글 내용", parentCommentId);
```

### 계층형 댓글 조회

```typescript
import { getCommentsHierarchical } from "@/app/actions/comments-hierarchical";

const comments = await getCommentsHierarchical(novelId);
// 반환값: HierarchicalComment[] (계층 구조)
```

### UI 컴포넌트 사용

```typescript
import { HierarchicalComments } from "@/components/HierarchicalComments";

<HierarchicalComments
  novelId={novelId}
  initialComments={comments}
/>
```

## 데이터베이스 구조

### comments 테이블

```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY,
  novel_id UUID REFERENCES novels(id),
  user_nickname TEXT,
  content TEXT,
  parent_id UUID REFERENCES comments(id),  -- 자기 참조
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### profiles 테이블

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname TEXT,
  reputation_score INTEGER DEFAULT 0,
  badge TEXT,  -- 자동 계산됨
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 평판 시스템

### 점수 획득 방법

- **댓글 작성**: +5점
- **투표**: +10점 (추후 구현)
- **작품 업로드**: +20점 (추후 구현)

### 뱃지 레벨

| 점수 | 뱃지 | 레벨 |
|------|------|------|
| 10,000+ | 전설 | legend |
| 5,000+ | 마스터 | master |
| 2,000+ | 전문가 | expert |
| 1,000+ | 베테랑 | veteran |
| 500+ | 고급 | advanced |
| 100+ | 중급 | intermediate |
| 50+ | 초급 | beginner |

### 자동 뱃지 업데이트

`update_user_badge()` 트리거 함수가 평판 점수 변경 시 자동으로 뱃지를 업데이트합니다.

## 재귀 쿼리 함수

### get_comments_with_replies()

```sql
SELECT * FROM get_comments_with_replies('novel-id-here');
```

이 함수는 다음을 반환합니다:
- 모든 댓글과 대댓글
- 각 댓글의 깊이 (depth)
- 계층 경로 (path)
- 최대 3단계까지만 조회 (3단계 이상은 평면화)

## UI 특징

### 들여쓰기

- 루트 댓글: 들여쓰기 없음
- 1단계 대댓글: 6px 들여쓰기 + 왼쪽 테두리
- 2단계 대댓글: 12px 들여쓰기 + 왼쪽 테두리
- 3단계 이상: 평면화 표시 (부모의 부모의 부모에 직접 추가)

### 대댓글 작성

- 각 댓글에 "답글" 버튼
- 클릭 시 대댓글 작성 폼 표시
- 3단계 이상에서는 대댓글 작성 불가 (평면화됨)

### 뱃지 표시

- 사용자 닉네임 옆에 뱃지 아이콘 표시
- 평판 점수도 함께 표시 (별 아이콘)

## 성능 최적화

### 인덱스

```sql
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_profiles_reputation ON public.profiles(reputation_score DESC);
```

### 쿼리 최적화

- 재귀 쿼리는 최대 3단계까지만 조회
- 인덱스를 활용한 빠른 조회
- 클라이언트 사이드에서 계층 구조 변환

## 문제 해결

### RPC 함수가 작동하지 않음

1. Supabase SQL Editor에서 `get_comments_with_replies` 함수가 생성되었는지 확인
2. 함수 권한 확인 (RLS 정책)
3. 폴백 로직이 작동하는지 확인 (일반 쿼리 사용)

### 평판 점수가 증가하지 않음

1. 트리거 함수 `increment_reputation_on_comment` 확인
2. profiles 테이블에 사용자 레코드가 생성되는지 확인
3. 트리거가 활성화되어 있는지 확인

### 대댓글이 표시되지 않음

1. `parent_id` 컬럼이 올바르게 설정되었는지 확인
2. 재귀 쿼리 함수가 올바르게 작동하는지 확인
3. 클라이언트 사이드에서 계층 구조 변환이 올바르게 작동하는지 확인

## 향후 개선 사항

### 1. 사용자 인증 연동

현재는 `user_nickname`만 사용하지만, 추후 `user_id` 컬럼을 추가하여:
- 정확한 사용자 식별
- 사용자별 평판 점수 추적
- 사용자 프로필 페이지

### 2. 댓글 좋아요

- 댓글 좋아요 기능 추가
- 좋아요 수에 따른 평판 점수 증가

### 3. 댓글 수정/삭제

- 댓글 수정 기능
- 댓글 삭제 기능 (대댓글이 있으면 "삭제된 댓글" 표시)

### 4. 알림 시스템

- 대댓글 작성 시 원댓글 작성자에게 알림
- 평판 점수 변화 알림

## 참고 자료

- [PostgreSQL WITH RECURSIVE 문서](https://www.postgresql.org/docs/current/queries-with.html)
- [Supabase RPC 함수 문서](https://supabase.com/docs/guides/database/functions)
- [React 재귀 컴포넌트 패턴](https://react.dev/learn/thinking-in-react)
