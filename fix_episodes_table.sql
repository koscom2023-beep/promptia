-- episodes 테이블의 image_urls 컬럼 수정
-- 빈 문자열('')을 빈 배열('[]')로 변경

-- 방법 1: 기존 테이블이 있다면 ALTER TABLE로 수정
ALTER TABLE episodes 
ALTER COLUMN image_urls SET DEFAULT '[]'::jsonb;

-- 방법 2: 기존에 잘못된 기본값이 설정된 경우, 먼저 기본값 제거 후 재설정
-- ALTER TABLE episodes ALTER COLUMN image_urls DROP DEFAULT;
-- ALTER TABLE episodes ALTER COLUMN image_urls SET DEFAULT '[]'::jsonb;

-- 방법 3: 테이블을 새로 생성하는 경우 (기존 데이터가 없다면)
/*
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- 소설용
  image_urls JSONB DEFAULT '[]'::jsonb, -- 웹툰용 (빈 배열로 초기화)
  episode_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT episodes_novel_id_episode_number_key UNIQUE (novel_id, episode_number)
);
*/

-- 기존 데이터 중 NULL이거나 빈 문자열인 경우 빈 배열로 업데이트
UPDATE episodes 
SET image_urls = '[]'::jsonb 
WHERE image_urls IS NULL 
   OR image_urls::text = '""' 
   OR image_urls::text = '';

-- 확인 쿼리
SELECT 
  id, 
  title, 
  image_urls,
  CASE 
    WHEN image_urls IS NULL THEN 'NULL'
    WHEN image_urls::text = '[]' THEN '빈 배열'
    ELSE '데이터 있음'
  END AS status
FROM episodes 
LIMIT 10;
