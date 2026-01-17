# 중력 기반 랭킹 시스템 가이드

## 개요

이 시스템은 Reddit/Hacker News 스타일의 중력(Gravity) 기반 랭킹 알고리즘을 사용합니다.

### 랭킹 공식

```
Score = ((V × 1) + (L × 5) + (P × 10) - 1) / (T + 2)^1.8
```

- **V**: 조회수 (`view_count`)
- **L**: 좋아요 (현재는 `vote_count`로 대체, 추후 별도 컬럼 추가 가능)
- **P**: 투표수 (`vote_count`)
- **T**: 경과 시간 (시간 단위, `created_at` 기준)

이 공식은 시간이 지날수록 점수가 감소하지만, 인기도가 높은 콘텐츠는 더 오래 상위에 유지됩니다.

## 설치 방법

### 1단계: 데이터베이스 스키마 생성

1. Supabase 대시보드 → SQL Editor로 이동
2. `create_tables_final.sql` 파일의 내용을 실행
3. `setup_ranking_system.sql` 파일의 내용을 실행

### 2단계: Materialized View 확인

```sql
-- 랭킹 조회 테스트
SELECT * FROM realtime_ranking 
WHERE type = 'novel' 
ORDER BY gravity_score DESC 
LIMIT 10;
```

### 3단계: 자동 갱신 설정

#### 방법 1: Supabase Edge Functions (권장)

1. Supabase 대시보드 → Edge Functions로 이동
2. 새 함수 생성: `refresh-ranking`
3. 다음 코드를 사용:

```typescript
// supabase/functions/refresh-ranking/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase.rpc('refresh_realtime_ranking')
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, message: 'Ranking refreshed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

4. Vercel Cron Jobs 또는 GitHub Actions에서 5분마다 호출:
   - URL: `https://[your-project].supabase.co/functions/v1/refresh-ranking`
   - 헤더: `Authorization: Bearer [anon-key]`

#### 방법 2: pg_cron (Supabase Pro 플랜만)

```sql
-- 5분마다 자동 갱신
SELECT cron.schedule(
  'refresh-ranking-every-5min',
  '*/5 * * * *',
  'SELECT refresh_realtime_ranking();'
);
```

#### 방법 3: 수동 갱신

필요시 서버 액션을 통해 수동으로 갱신:

```typescript
import { refreshRanking } from '@/app/actions/ranking'

// 서버 컴포넌트나 API 라우트에서
await refreshRanking()
```

## 사용 방법

### 랭킹 조회

```typescript
import { getRanking, getTop3Ranking } from '@/app/actions/ranking'

// 전체 랭킹 TOP 10
const rankings = await getRanking()

// 소설 카테고리 TOP 10
const novelRankings = await getRanking('novel')

// 웹툰 카테고리 TOP 10
const webtoonRankings = await getRanking('webtoon')

// TOP 3 (모든 카테고리)
const top3 = await getTop3Ranking()
```

### 반환 데이터 구조

```typescript
interface NovelRanking {
  id: string
  title: string
  description: string | null
  type: "novel" | "webtoon" | "video"
  thumbnail_url: string | null
  view_count: number
  vote_count: number
  popularity_score: number  // gravity_score
  created_at: string
}
```

## 성능 최적화

1. **Materialized View 사용**: 복잡한 계산을 미리 수행하여 조회 성능 향상
2. **인덱스**: `type`, `gravity_score`, `created_at`에 인덱스 생성
3. **자동 갱신**: 5분마다 자동 갱신으로 실시간성 유지

## 주의사항

1. **좋아요 컬럼**: 현재는 `vote_count`를 좋아요로도 사용하고 있습니다. 추후 별도 `like_count` 컬럼을 추가하면 공식을 수정해야 합니다.

2. **갱신 주기**: 너무 자주 갱신하면 데이터베이스 부하가 증가합니다. 5분 간격이 적절합니다.

3. **Supabase 무료 플랜**: pg_cron이 비활성화되어 있을 수 있으므로 Edge Functions를 사용하세요.

## 문제 해결

### Materialized View가 없는 경우

`ranking.ts`는 자동으로 폴백하여 직접 계산합니다. 하지만 성능을 위해 Materialized View를 생성하는 것을 권장합니다.

### 랭킹이 업데이트되지 않는 경우

1. Materialized View가 최근에 갱신되었는지 확인:
   ```sql
   SELECT * FROM pg_stat_user_tables WHERE relname = 'realtime_ranking';
   ```

2. 수동으로 갱신:
   ```sql
   SELECT refresh_realtime_ranking();
   ```

3. Edge Function이 정상 작동하는지 확인

## 향후 개선 사항

1. **좋아요 컬럼 추가**: `novels` 테이블에 `like_count` 컬럼 추가
2. **가중치 조정**: 공식의 가중치(1, 5, 10)를 A/B 테스트로 최적화
3. **카테고리별 가중치**: 소설/웹툰/영상에 따라 다른 가중치 적용
4. **실시간 업데이트**: Supabase Realtime을 사용한 실시간 랭킹 업데이트
