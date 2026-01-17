# 운영 자동화 시스템 가이드

## 개요

프롬프티아의 운영 리소스를 최소화하기 위한 자동화 시스템입니다.
AI 모더레이션, 주기적 리셋, 명예의 전당 기능을 포함합니다.

## 주요 기능

### 1. AI 모더레이션

OpenAI Moderation API를 사용하여 유해 콘텐츠를 자동으로 감지하고 작품 상태를 업데이트합니다.

**감지 항목:**
- 성인 콘텐츠
- 폭력
- 혐오 발언
- 자해
- 성적 미성년자 콘텐츠
- 폭력/그래픽 콘텐츠
- 증오/위협 콘텐츠
- 하레스먼트
- 자해/자살
- 무기
- 불법 활동

### 2. 주기적 리셋

매주 월요일 00:00에 자동으로 실행됩니다:

- **명예의 전당 기록**: 주간 XP 상위 3명 기록
- **주간 XP 리셋**: 모든 유저의 weekly_xp를 0으로 초기화

### 3. 명예의 전당

주간 XP 상위 3명이 자동으로 기록됩니다.

## 설정 방법

### 1. 데이터베이스 마이그레이션

Supabase SQL Editor에서 `create_automation_system.sql` 파일을 실행하세요:

```sql
-- 전체 스크립트 실행
```

### 2. Edge Function 배포

#### 환경 변수 설정

Supabase Dashboard → Edge Functions → moderate-content → Settings:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 배포

```bash
# Supabase CLI 사용
supabase functions deploy moderate-content

# 또는 Supabase Dashboard에서 직접 업로드
```

### 3. 자동 모더레이션 통합

작품 업로드 시 자동으로 모더레이션을 실행하도록 통합:

```typescript
import { autoModerateNovel } from "@/app/actions/moderation";

// 작품 업로드 후
const result = await autoModerateNovel(novelId, title, description, content);
if (result.flagged) {
  // 유해 콘텐츠 감지됨
  console.log("작품이 자동으로 거부되었습니다.");
}
```

## 데이터베이스 스키마

### hall_of_fame

```sql
CREATE TABLE public.hall_of_fame (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  weekly_xp BIGINT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_start_date, rank)
);
```

### moderation_logs

```sql
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY,
  novel_id UUID,
  episode_id UUID,
  status TEXT NOT NULL,
  reason TEXT,
  flagged_categories JSONB,
  category_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 사용 방법

### 1. AI 모더레이션

#### Server Action 사용

```typescript
import { moderateContent } from "@/app/actions/moderation";

const result = await moderateContent(novelId, content, title);
if (result.flagged) {
  console.log("유해 콘텐츠 감지:", result.categories);
}
```

#### 직접 Edge Function 호출

```typescript
const { data, error } = await supabase.functions.invoke("moderate-content", {
  body: {
    novel_id: "novel-uuid",
    content: "검사할 콘텐츠",
    title: "작품 제목",
  },
});
```

### 2. 명예의 전당 조회

```typescript
import { getHallOfFame } from "@/app/actions/moderation";

const hallOfFame = await getHallOfFame(4); // 최근 4주
```

### 3. 주간 리셋 수동 실행

```typescript
import { manualWeeklyReset } from "@/app/actions/moderation";

await manualWeeklyReset();
```

## 자동화 스케줄

### pg_cron 스케줄

- **이름**: `weekly-reset-monday`
- **실행 시간**: 매주 월요일 00:00
- **함수**: `process_weekly_reset()`

### 스케줄 확인

```sql
SELECT * FROM cron.job WHERE jobname = 'weekly-reset-monday';
```

### 스케줄 수동 실행

```sql
SELECT manual_weekly_reset();
```

## 재시도 로직

### Edge Function 재시도

- **최대 시도 횟수**: 3회
- **백오프 전략**: 지수 백오프 (1초, 2초, 4초)
- **최대 대기 시간**: 5초

### 에러 핸들링

1. **OpenAI API 오류**: 재시도 후 실패 시 오류 반환
2. **Supabase 오류**: 로그 기록 후 오류 반환
3. **네트워크 오류**: 재시도 로직으로 처리

## 모더레이션 결과

### 통과

```json
{
  "flagged": false,
  "action": "approved"
}
```

### 거부

```json
{
  "flagged": true,
  "categories": {
    "sexual": true,
    "violence": false
  },
  "category_scores": {
    "sexual": 0.95
  },
  "action": "rejected"
}
```

## 유용한 쿼리

### 명예의 전당 조회

```sql
SELECT 
  hof.week_start_date,
  hof.rank,
  hof.weekly_xp,
  u.email
FROM hall_of_fame hof
JOIN auth.users u ON hof.user_id = u.id
ORDER BY hof.week_start_date DESC, hof.rank ASC
LIMIT 12;
```

### 모더레이션 로그 조회

```sql
SELECT * FROM moderation_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### 주간 XP 상위 10명

```sql
SELECT 
  user_id,
  weekly_xp,
  total_xp,
  level
FROM gamification_profiles
WHERE weekly_xp > 0
ORDER BY weekly_xp DESC
LIMIT 10;
```

## 문제 해결

### 모더레이션이 작동하지 않음

1. Edge Function 환경 변수 확인
2. OpenAI API 키 확인
3. Supabase Service Role Key 확인
4. Edge Function 로그 확인

### 주간 리셋이 실행되지 않음

1. pg_cron 확장 활성화 확인
2. 스케줄 확인: `SELECT * FROM cron.job WHERE jobname = 'weekly-reset-monday';`
3. 수동 실행 테스트: `SELECT manual_weekly_reset();`

### 명예의 전당에 기록되지 않음

1. `gamification_profiles` 테이블에 데이터 확인
2. `weekly_xp > 0`인 유저 확인
3. 중복 방지 로직 확인 (같은 주에 이미 기록되었는지)

## 보안

### RLS 정책

- **hall_of_fame**: 모든 유저가 조회 가능
- **moderation_logs**: 유저가 자신의 작품 로그만 조회 가능

### Edge Function 보안

- Service Role Key 사용 (RLS 우회)
- CORS 헤더 설정
- 에러 메시지 최소화

## 비용 최적화

### OpenAI API 비용

- Moderation API는 저렴한 편 (요청당 $0.0001 미만)
- 재시도 로직으로 불필요한 호출 최소화
- 캐싱 고려 (같은 콘텐츠 재검사 방지)

### pg_cron 비용

- Supabase Pro 플랜 이상에서만 사용 가능
- 무료 플랜에서는 외부 cron 서비스 사용 권장

## 참고 자료

- [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL pg_cron](https://github.com/citusdata/pg_cron)
