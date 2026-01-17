# 게이미피케이션 시스템 가이드

## 개요

프롬프티아 Phase 2 게이미피케이션 시스템은 사용자 참여를 높이기 위한 경험치(XP), 연속 기록(Streak), 업적 시스템입니다.

## 주요 기능

### 1. 경험치(XP) 시스템

- **total_xp**: 총 경험치
- **weekly_xp**: 주간 경험치 (매주 리셋)
- **level**: 레벨 (레벨 공식: `level = floor(sqrt(total_xp / 100)) + 1`)

### 2. 연속 기록(Streak) 시스템

- **current_streak**: 현재 연속 기록
- **longest_streak**: 최장 연속 기록
- **Gaps and Islands 알고리즘**: 실제 연속 날짜를 정확히 계산

### 3. 업적 시스템

- **achievements**: 업적 메타데이터
- **user_achievements**: 유저가 달성한 업적 기록
- 업적 달성 시 XP 보상

### 4. 활동 로그

- **activity_logs**: 모든 활동 기록 (불변 로그)
- 활동 유형별 XP 지급
- 트리거를 통한 자동 프로필 업데이트

## 데이터베이스 스키마

### gamification_profiles

```sql
CREATE TABLE public.gamification_profiles (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_xp BIGINT DEFAULT 0,
  weekly_xp BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### achievements

```sql
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_reward BIGINT DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### user_achievements

```sql
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
```

### activity_logs

```sql
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  xp_earned BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 설정 방법

### 1. 데이터베이스 마이그레이션

Supabase SQL Editor에서 `create_gamification_system.sql` 파일을 실행하세요:

```sql
-- 전체 스크립트 실행
```

### 2. Server Actions 사용

```typescript
import { logActivity, getGamificationProfile } from "@/app/actions/gamification";

// 활동 로그 기록
await logActivity("comment", 10, {
  comment_id: "comment-uuid",
  novel_id: "novel-uuid",
});

// 프로필 조회
const profile = await getGamificationProfile();
```

## 활동 유형 및 XP

### 기본 XP 지급

| 활동 유형 | 기본 XP | 설명 |
|-----------|---------|------|
| `comment` | 10 | 댓글 작성 |
| `reply` | 5 | 대댓글 작성 |
| `vote` | 5 | 투표 |
| `upload` | 50 | 작품 업로드 |
| `daily_login` | 5 | 일일 로그인 |
| `view` | 1 | 작품 조회 |

### 업적 보상 XP

업적 달성 시 추가 XP가 지급됩니다:

- 첫 댓글 작성: +50 XP
- 첫 투표: +30 XP
- 첫 업로드: +100 XP
- 3일 연속 접속: +50 XP
- 7일 연속 접속: +150 XP
- 30일 연속 접속: +500 XP
- 레벨 5 달성: +200 XP
- 레벨 10 달성: +500 XP
- 레벨 20 달성: +1000 XP

## Streak 계산 알고리즘

### Gaps and Islands 알고리즘

연속 날짜를 정확히 계산하기 위해 Gaps and Islands 알고리즘을 사용합니다:

```sql
WITH activity_dates AS (
  SELECT DISTINCT activity_date
  FROM activity_logs
  WHERE user_id = p_user_id
    AND activity_date <= CURRENT_DATE
  ORDER BY activity_date DESC
),
date_groups AS (
  SELECT 
    activity_date,
    activity_date - ROW_NUMBER() OVER (ORDER BY activity_date DESC)::INTEGER AS date_group
  FROM activity_dates
),
consecutive_days AS (
  SELECT 
    date_group,
    MIN(activity_date) AS start_date,
    MAX(activity_date) AS end_date,
    COUNT(*) AS days_count
  FROM date_groups
  GROUP BY date_group
  ORDER BY start_date DESC
)
SELECT days_count
FROM consecutive_days
WHERE end_date = CURRENT_DATE;
```

### 동작 방식

1. 각 활동 날짜에 대해 그룹 번호 할당
2. 연속된 날짜를 그룹으로 묶음
3. 오늘 날짜가 포함된 그룹의 연속 일수 계산

## 트리거 로직

### 자동 프로필 업데이트

`activity_logs`에 새로운 행이 추가될 때마다 자동으로:

1. **XP 업데이트**: `total_xp`와 `weekly_xp` 증가
2. **레벨 계산**: 레벨 공식에 따라 레벨 업데이트
3. **Streak 계산**: 날짜가 바뀌었으면 streak 재계산
4. **최장 Streak 업데이트**: `longest_streak` 업데이트

### 동일 날짜 처리

- 동일 날짜의 활동은 XP만 추가
- 날짜가 바뀌었을 때만 streak 재계산

## 보안 (RLS)

### Row Level Security 정책

모든 테이블에 RLS가 적용되어 있습니다:

- **gamification_profiles**: 유저가 자신의 프로필만 조회/업데이트 가능
- **achievements**: 모든 유저가 활성화된 업적 목록 조회 가능
- **user_achievements**: 유저가 자신의 업적만 조회 가능
- **activity_logs**: 유저가 자신의 활동 로그만 조회 가능

## 사용 예시

### 1. 댓글 작성 시 XP 지급

```typescript
// 댓글 작성 후
await logActivity("comment", 10, {
  comment_id: commentId,
  novel_id: novelId,
});
```

### 2. 투표 시 XP 지급

```typescript
// 투표 후
await logActivity("vote", 5, {
  novel_id: novelId,
  episode_id: episodeId,
});
```

### 3. 작품 업로드 시 XP 지급

```typescript
// 작품 업로드 후
await logActivity("upload", 50, {
  novel_id: novelId,
  type: "novel",
});
```

### 4. 일일 로그인 보상

```typescript
// 로그인 시 (하루에 한 번만)
await logActivity("daily_login", 5);
```

### 5. 업적 달성 체크

```typescript
// 댓글 작성 후
await checkAndGrantAchievement("first_comment");

// Streak 체크
const profile = await getGamificationProfile();
if (profile?.current_streak === 7) {
  await checkAndGrantAchievement("streak_7");
}
```

## 유용한 쿼리

### 사용자 프로필 조회

```sql
SELECT * FROM gamification_profiles 
WHERE user_id = 'user-uuid';
```

### 사용자 업적 조회

```sql
SELECT 
  ua.unlocked_at,
  a.name,
  a.description,
  a.xp_reward
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = 'user-uuid'
ORDER BY ua.unlocked_at DESC;
```

### 사용자 활동 로그 조회

```sql
SELECT * FROM activity_logs 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC 
LIMIT 50;
```

### Streak 수동 계산

```sql
SELECT calculate_user_streak('user-uuid');
```

### 레벨별 사용자 수

```sql
SELECT level, COUNT(*) as user_count
FROM gamification_profiles
GROUP BY level
ORDER BY level DESC;
```

## 주간 XP 리셋

매주 월요일 자동으로 주간 XP가 리셋됩니다:

```sql
SELECT reset_weekly_xp();
```

pg_cron을 사용하여 자동 실행할 수 있습니다:

```sql
SELECT cron.schedule(
  'reset-weekly-xp',
  '0 0 * * 1', -- 매주 월요일 00:00
  'SELECT reset_weekly_xp();'
);
```

## 문제 해결

### 프로필이 생성되지 않음

- `activity_logs`에 첫 활동이 기록되면 자동으로 프로필이 생성됩니다
- 또는 수동으로 프로필을 생성할 수 있습니다

### Streak가 정확하지 않음

- `calculate_user_streak()` 함수를 수동으로 실행하여 확인
- `activity_logs`의 `activity_date`가 올바른지 확인

### XP가 업데이트되지 않음

- 트리거가 정상 작동하는지 확인
- `activity_logs`에 데이터가 삽입되었는지 확인

## 참고 자료

- [PostgreSQL Gaps and Islands](https://www.sqlservercentral.com/articles/gaps-and-islands)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
