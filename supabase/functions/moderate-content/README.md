# AI 모더레이션 Edge Function

## 개요

OpenAI Moderation API를 사용하여 유해 콘텐츠를 감지하고 작품 상태를 자동으로 업데이트하는 Supabase Edge Function입니다.

## 설정

### 1. 환경 변수 설정

Supabase Dashboard → Edge Functions → moderate-content → Settings에서 다음 환경 변수를 설정하세요:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 배포

```bash
# Supabase CLI 사용
supabase functions deploy moderate-content

# 또는 Supabase Dashboard에서 직접 업로드
```

## 사용 방법

### Server Action에서 호출

```typescript
import { moderateContent } from "@/app/actions/moderation";

const result = await moderateContent(novelId, content, title);
if (result.flagged) {
  // 유해 콘텐츠 감지됨
  console.log("감지된 카테고리:", result.categories);
}
```

### 직접 호출

```typescript
const { data, error } = await supabase.functions.invoke("moderate-content", {
  body: {
    novel_id: "novel-uuid",
    content: "검사할 콘텐츠",
    title: "작품 제목",
  },
});
```

## 응답 형식

### 성공 (유해 콘텐츠 없음)

```json
{
  "flagged": false,
  "action": "approved"
}
```

### 성공 (유해 콘텐츠 감지)

```json
{
  "flagged": true,
  "categories": {
    "sexual": true,
    "violence": false,
    "hate": false
  },
  "category_scores": {
    "sexual": 0.95,
    "violence": 0.1
  },
  "action": "rejected"
}
```

## 재시도 로직

- 최대 3회 재시도
- 지수 백오프 (1초, 2초, 4초)
- 모든 재시도 실패 시 오류 반환

## 에러 핸들링

- OpenAI API 오류: 재시도 후 실패 시 오류 반환
- Supabase 오류: 로그 기록 후 오류 반환
- 네트워크 오류: 재시도 로직으로 처리
