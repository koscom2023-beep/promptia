# 데이터베이스 스키마 및 보안 가이드

## 개요

프롬프티아의 데이터베이스 스키마와 보안 정책에 대한 상세 가이드입니다.
보고서 3장 및 부록을 참고하여 설계되었습니다.

## 테이블 구조

### 1. works 테이블

작품 정보 및 벡터 데이터를 저장하는 메인 테이블입니다.

#### 주요 컬럼

**기본 정보:**
- `id`: UUID (Primary Key)
- `title`: 작품 제목
- `description`: 작품 설명
- `author_id`: 작가 ID (auth.users 참조)
- `type`: 작품 유형 ('novel', 'webtoon', 'video')

**미디어:**
- `thumbnail_url`: 썸네일 이미지 URL
- `cover_image_url`: 커버 이미지 URL

**통계:**
- `view_count`: 조회수
- `vote_count`: 투표수 (트리거로 자동 증가)
- `like_count`: 좋아요 수

**상태:**
- `status`: 상태 ('pending', 'approved', 'rejected', 'blocked')
- `is_blocked`: 차단 여부
- `is_featured`: 추천 작품 여부

**AI 메타데이터:**
- `prompt_used`: 사용된 프롬프트
- `creation_intent`: 창작 의도
- `worldview_description`: 세계관 설명
- `ai_model`: 사용된 AI 모델
- `seed`: 시드 값
- `steps`: 생성 스텝 수

**벡터 데이터:**
- `embedding`: vector(1536) - OpenAI text-embedding-ada-002 벡터

**메타데이터:**
- `metadata`: JSONB - 추가 메타데이터
- `tags`: TEXT[] - 태그 배열

#### 인덱스

- 기본 인덱스: `author_id`, `type`, `status`, `is_blocked`, `is_featured`
- 정렬 인덱스: `created_at`, `published_at`, `popularity_score`, `vote_count`, `view_count`
- 벡터 인덱스: `embedding` (HNSW 알고리즘)
- 검색 인덱스: `metadata` (GIN), `tags` (GIN)

### 2. votes 테이블

투표 정보를 저장하는 테이블입니다. IP 및 핑거프린트 기반 중복 방지를 지원합니다.

#### 주요 컬럼

- `id`: UUID (Primary Key)
- `work_id`: 작품 ID (works 참조)
- `user_id`: 유저 ID (auth.users 참조, nullable)
- `ip_address`: IP 주소 (INET 타입)
- `fingerprint`: 클라이언트 핑거프린트
- `user_agent`: User Agent 문자열
- `vote_type`: 투표 타입 ('like', 'dislike', 'pick')
- `created_at`: 생성 시간

#### 제약조건

중복 투표 방지를 위한 유니크 제약:
- `unique_vote_per_work_ip`: 같은 작품에 같은 IP로 중복 투표 불가
- `unique_vote_per_work_fingerprint`: 같은 작품에 같은 핑거프린트로 중복 투표 불가
- `unique_vote_per_work_user`: 같은 작품에 같은 유저로 중복 투표 불가

## 보안 (Row Level Security)

### works 테이블 정책

1. **조회 정책**: 모든 유저가 조회 가능 (blocked되지 않은 작품만)
   ```sql
   USING (is_blocked = false AND status IN ('approved', 'pending'))
   ```

2. **업로드 정책**: 인증된 유저만 업로드 가능
   ```sql
   WITH CHECK (auth.role() = 'authenticated')
   ```

3. **수정 정책**: 작가만 자신의 작품 수정 가능
   ```sql
   USING (auth.uid() = author_id)
   ```

4. **삭제 정책**: 작가만 자신의 작품 삭제 가능
   ```sql
   USING (auth.uid() = author_id)
   ```

### votes 테이블 정책

1. **조회 정책**: 모든 유저가 투표 조회 가능
   ```sql
   USING (true)
   ```

2. **투표 정책**: 인증된 유저만 투표 가능
   ```sql
   WITH CHECK (
     auth.role() = 'authenticated'
     AND (ip_address IS NOT NULL OR fingerprint IS NOT NULL)
   )
   ```

3. **삭제 정책**: 투표한 유저만 자신의 투표 삭제 가능
   ```sql
   USING (
     auth.uid() = user_id
     OR ip_address = inet_client_addr()
   )
   ```

## 트리거 및 함수

### 1. 투표 수 자동 증가

**함수**: `increment_work_vote_count()`
- `votes` 테이블에 INSERT 시 자동 실행
- `works.vote_count`를 원자적으로 증가
- `last_interaction_at` 및 `updated_at` 업데이트

**트리거**: `trigger_increment_vote_count`
```sql
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.increment_work_vote_count();
```

### 2. 투표 수 자동 감소

**함수**: `decrement_work_vote_count()`
- `votes` 테이블에서 DELETE 시 자동 실행
- `works.vote_count`를 원자적으로 감소 (음수 방지)

**트리거**: `trigger_decrement_vote_count`
```sql
AFTER DELETE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_work_vote_count();
```

### 3. updated_at 자동 업데이트

**함수**: `update_updated_at_column()`
- `works` 테이블의 `updated_at`을 자동으로 업데이트

**트리거**: `trigger_update_works_updated_at`
```sql
BEFORE UPDATE ON public.works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

## 유틸리티 함수

### 1. 벡터 검색 함수

```sql
SELECT * FROM public.search_similar_works(
  query_embedding vector(1536),  -- 검색할 벡터
  0.7,                            -- 유사도 임계값
  10                              -- 결과 개수
);
```

**사용 예시:**
```typescript
// 클라이언트에서 사용
const { data } = await supabase.rpc('search_similar_works', {
  query_embedding: embeddingArray,
  similarity_threshold: 0.7,
  result_limit: 10
});
```

### 2. 중복 투표 체크 함수

```sql
SELECT public.check_duplicate_vote(
  'work-uuid'::UUID,
  '192.168.1.1'::INET,      -- IP 주소 (선택)
  'fingerprint-string',     -- 핑거프린트 (선택)
  'user-uuid'::UUID         -- 유저 ID (선택)
);
```

**반환값:**
- `true`: 중복 투표 존재
- `false`: 중복 투표 없음

## 마이그레이션 실행 방법

### Supabase SQL Editor에서 실행

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `migration.sql` 파일 내용 복사
4. 실행

### 주의사항

⚠️ **데이터 백업**: 기존 테이블이 있다면 `DROP TABLE` 전에 백업하세요.

⚠️ **pgvector 확장**: Supabase에서 이미 활성화되어 있을 수 있습니다. 에러가 나면 무시하고 진행하세요.

⚠️ **RLS 정책**: 프로덕션 환경에서는 관리자 정책을 활성화하는 것을 권장합니다.

## 벡터 검색 설정

### pgvector 확장

벡터 검색을 위해 `pgvector` 확장이 필요합니다:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### HNSW 인덱스

빠른 근사 검색을 위한 HNSW 인덱스:

```sql
CREATE INDEX idx_works_embedding ON public.works 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**파라미터 설명:**
- `m`: 각 노드의 최대 연결 수 (기본값: 16)
- `ef_construction`: 인덱스 생성 시 검색 범위 (기본값: 64)

### 벡터 차원

OpenAI `text-embedding-ada-002` 모델 사용 시:
- 차원: 1536
- 타입: `vector(1536)`

## 중복 투표 방지 전략

### 1. 데이터베이스 제약조건

- IP 기반: `unique_vote_per_work_ip`
- Fingerprint 기반: `unique_vote_per_work_fingerprint`
- User 기반: `unique_vote_per_work_user`

### 2. 애플리케이션 레벨 체크

```typescript
// 투표 전 중복 체크
const isDuplicate = await supabase.rpc('check_duplicate_vote', {
  p_work_id: workId,
  p_ip_address: clientIp,
  p_fingerprint: fingerprint,
  p_user_id: userId
});

if (isDuplicate) {
  throw new Error('이미 투표하셨습니다.');
}
```

### 3. 핑거프린트 생성

클라이언트에서 브라우저/디바이스 핑거프린트 생성:

```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fp = await FingerprintJS.load();
const result = await fp.get();
const fingerprint = result.visitorId;
```

## 성능 최적화

### 인덱스 전략

1. **기본 인덱스**: 자주 필터링되는 컬럼
2. **정렬 인덱스**: 자주 정렬되는 컬럼
3. **벡터 인덱스**: HNSW 알고리즘 (근사 검색)
4. **GIN 인덱스**: JSONB 및 배열 검색

### 쿼리 최적화 팁

1. **인덱스 활용**: WHERE 절에 인덱스된 컬럼 사용
2. **LIMIT 사용**: 대량 데이터 조회 시 LIMIT 필수
3. **벡터 검색**: 유사도 임계값 조정으로 성능 최적화

## 문제 해결

### 벡터 인덱스 생성 실패

```sql
-- pgvector 확장 확인
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 수동으로 확장 활성화
CREATE EXTENSION vector;
```

### RLS 정책 오류

```sql
-- 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'works';

-- 정책 삭제 후 재생성
DROP POLICY IF EXISTS "policy_name" ON public.works;
```

### 트리거 작동 안 함

```sql
-- 트리거 확인
SELECT * FROM pg_trigger WHERE tgname = 'trigger_increment_vote_count';

-- 트리거 재생성
DROP TRIGGER IF EXISTS trigger_increment_vote_count ON public.votes;
CREATE TRIGGER trigger_increment_vote_count ...
```

## 참고 자료

- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [pgvector 문서](https://github.com/pgvector/pgvector)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
