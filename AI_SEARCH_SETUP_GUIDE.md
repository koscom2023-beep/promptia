# AI 검색 시스템 설정 가이드

## 개요

pgvector를 활용한 벡터 유사도 검색 시스템입니다. OpenAI의 text-embedding-ada-002 모델을 사용하여 작품 설명을 벡터로 변환하고, PostgreSQL의 pgvector 확장을 사용하여 유사도 검색을 수행합니다.

## 환경 변수 설정

```env
# OpenAI API Key
OPENAI_API_KEY=sk-...
```

## 데이터베이스 설정

### 1. pgvector 확장 활성화

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. 임베딩 컬럼 확인

`novels` 테이블에 `embedding` 컬럼이 있어야 합니다:

```sql
-- migration.sql에 이미 포함되어 있음
embedding vector(1536)
```

### 3. 벡터 인덱스 생성

```sql
CREATE INDEX idx_works_embedding ON public.novels 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

## 사용법

### 작품 임베딩 업데이트

```typescript
import { updateWorkEmbedding } from "@/lib/supabase/search";

// 단일 작품 임베딩 업데이트
const success = await updateWorkEmbedding(workId);

// 배치 업데이트
import { batchUpdateEmbeddings } from "@/lib/supabase/search";
const results = await batchUpdateEmbeddings([workId1, workId2, workId3]);
```

### 작품 검색

```typescript
import { searchSimilarWorks } from "@/lib/supabase/search";

// 기본 검색
const result = await searchSimilarWorks("재벌가 로맨스", 10, 0.7);

// 타입 필터링
const novelResults = await searchSimilarWorks(
  "판타지 소설",
  10,
  0.7,
  "novel"
);
```

### 검색 결과

```typescript
{
  success: true,
  results: [
    {
      id: "work-id",
      title: "작품 제목",
      description: "작품 설명",
      type: "novel",
      thumbnail_url: "...",
      view_count: 1000,
      vote_count: 50,
      similarity: 0.85, // 유사도 점수 (0-1)
    },
    // ...
  ],
  query: "검색 쿼리",
  embeddingGenerated: true,
}
```

## 자동 임베딩 생성

작품 업로드 시 자동으로 임베딩을 생성하려면:

```typescript
// app/actions/upload.ts 또는 유사한 파일
import { updateWorkEmbedding } from "@/lib/supabase/search";

// 작품 생성 후
const { data: work } = await supabase.from("novels").insert({...});

// 임베딩 생성 (비동기)
if (work) {
  updateWorkEmbedding(work.id).catch(console.error);
}
```

## 성능 최적화

1. **인덱스 사용**: HNSW 인덱스로 빠른 검색
2. **임계값 조정**: `similarityThreshold`를 조정하여 결과 품질 제어
3. **배치 처리**: 여러 작품의 임베딩을 한 번에 업데이트

## 문제 해결

### 임베딩 생성 실패

- OpenAI API Key 확인
- API 사용량 한도 확인
- 네트워크 연결 확인

### 검색 결과 없음

- 임베딩이 생성되었는지 확인
- 유사도 임계값 낮추기 (0.5 정도)
- RPC 함수가 데이터베이스에 있는지 확인

### RPC 함수 없음

`search_similar_works` RPC 함수가 없으면 자동으로 폴백 모드로 전환됩니다. JavaScript에서 cosine similarity를 계산하지만, 성능이 떨어질 수 있습니다.
