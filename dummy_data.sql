-- 프롬프티아 더미 데이터 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 임시 사용자 ID 생성 (실제 auth.users 테이블의 user_id를 사용하거나, 아래 UUID를 사용)
-- 만약 이미 로그인한 사용자가 있다면, 그 user_id를 사용하세요
DO $$
DECLARE
  dummy_user_id UUID;
BEGIN
  -- 기존 사용자가 있으면 첫 번째 사용자 ID 사용, 없으면 새 UUID 생성
  SELECT id INTO dummy_user_id FROM auth.users LIMIT 1;
  
  IF dummy_user_id IS NULL THEN
    dummy_user_id := gen_random_uuid();
  END IF;

  -- 소설 5개 생성
  INSERT INTO novels (id, user_id, title, description, category, cover_image_url, view_count, hidden, prompt_used, creation_intent, worldview_description, created_at)
  VALUES
    (gen_random_uuid(), dummy_user_id, '재벌집 막내 AI', 'AI가 재벌집 막내로 환생했다! 현대판 판타지 소설로, AI의 독특한 시각으로 재벌가의 권력 게임을 풀어나간다.', 'novel', 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=재벌집+막내+AI', 1250, false, '재벌집 막내로 환생한 AI의 이야기를 그려달라. 현대판 판타지 장르로, 권력과 돈의 세계를 AI의 독특한 시각으로 풀어내라.', 'AI의 객관적이고 논리적인 사고가 재벌가의 복잡한 인간관계와 권력 게임을 어떻게 해석하는지 보여주고 싶었다.', '현대 한국의 재벌가를 배경으로, AI가 인간의 감정과 욕망을 이해해가는 과정을 그린다. 권력, 돈, 사랑, 배신 등 다양한 요소가 얽혀있다.', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), dummy_user_id, '전지적 독자 시점 2', '독자가 소설 속 주인공이 되어버린 미스터리 스릴러. 현실과 소설의 경계가 무너진다.', 'novel', 'https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=전지적+독자+시점+2', 980, false, '독자가 소설 속 주인공이 되어버린 상황을 그려달라. 현실과 가상의 경계가 모호해지는 미스터리 스릴러로 작성해달라.', '메타픽션의 재미를 살리면서도 독자들이 몰입할 수 있는 스토리를 만들고 싶었다.', '현대 서울을 배경으로, 소설 속 세계와 현실이 교차하는 판타지적 요소가 가미된 미스터리 세계관이다.', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), dummy_user_id, 'AI 마법사의 귀환', '마법 세계에서 AI가 마법사로 환생했다! 마법과 기술의 융합 판타지.', 'novel', 'https://via.placeholder.com/300x400/95E1D3/FFFFFF?text=AI+마법사의+귀환', 2100, false, 'AI가 마법 세계로 환생하여 마법사가 되는 이야기를 써달라. 마법과 기술의 융합을 다룬 판타지 장르로 작성해달라.', '마법이라는 판타지 요소와 AI라는 SF 요소를 결합하여 새로운 장르를 시도하고 싶었다.', '마법이 존재하는 판타지 세계관이지만, AI의 논리적 사고로 마법을 과학적으로 분석하고 활용하는 독특한 설정이다.', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), dummy_user_id, '로봇과 함께한 하루', '일상 속에서 로봇과 함께 살아가는 따뜻한 이야기. SF와 일상물의 만남.', 'novel', 'https://via.placeholder.com/300x400/F38181/FFFFFF?text=로봇과+함께한+하루', 750, false, '일상 속에서 가정용 로봇과 함께 살아가는 이야기를 그려달라. 따뜻하고 감성적인 일상물로 작성해달라.', '기술이 발전해도 인간의 감정과 관계는 변하지 않는다는 메시지를 전달하고 싶었다.', '2030년대 한국을 배경으로, 가정용 AI 로봇이 보편화된 일상 속에서 벌어지는 따뜻한 이야기다.', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), dummy_user_id, '가상현실 게임 속 생존기', 'VR 게임에 갇힌 플레이어들의 생존 스토리. 게임과 현실의 경계가 사라진다.', 'novel', 'https://via.placeholder.com/300x400/AA96DA/FFFFFF?text=VR+게임+생존기', 1650, false, '가상현실 게임에 갇힌 플레이어들의 생존 이야기를 그려달라. 액션과 서바이벌 요소가 가미된 SF 스릴러로 작성해달라.', '게임과 현실의 경계를 흐리게 하여 독자들에게 몰입감을 주고 싶었다.', '최첨단 VR 기술이 구현한 가상현실 게임 세계관으로, 게임 내에서 죽으면 현실에서도 죽는다는 설정이다.', NOW() - INTERVAL '1 day');

  -- 웹툰 5개 생성
  INSERT INTO novels (id, user_id, title, description, category, cover_image_url, view_count, hidden, prompt_used, creation_intent, worldview_description, created_at)
  VALUES
    (gen_random_uuid(), dummy_user_id, 'AI 히어로의 탄생', 'AI가 슈퍼히어로가 되어 악당과 맞서는 액션 웹툰. 화려한 전투 장면과 감동적인 스토리.', 'webtoon', 'https://via.placeholder.com/300x400/FFD93D/000000?text=AI+히어로', 890, false, 'AI가 슈퍼히어로가 되어 악당과 맞서는 이야기를 웹툰 형식으로 그려달라. 액션과 히어로 요소가 강한 작품으로 만들어달라.', 'AI의 논리적 사고와 히어로의 정의감을 결합하여 독특한 캐릭터를 만들고 싶었다.', '현대 도시를 배경으로 한 슈퍼히어로 세계관으로, AI가 초능력을 얻어 정의를 실현하는 이야기다.', NOW() - INTERVAL '6 days'),
    (gen_random_uuid(), dummy_user_id, '로맨스 AI의 연애 수업', '연애를 배우는 AI의 로맨틱 코미디 웹툰. 유쾌하고 달콤한 스토리.', 'webtoon', 'https://via.placeholder.com/300x400/FF6B9D/FFFFFF?text=로맨스+AI', 1120, false, '연애를 배우는 AI의 이야기를 로맨틱 코미디 웹툰으로 그려달라. 유쾌하고 달콤한 분위기로 작성해달라.', 'AI의 객관적 시각으로 인간의 감정과 사랑을 해석하는 재미를 보여주고 싶었다.', '대학교 캠퍼스를 배경으로 한 현대 로맨스 세계관으로, AI가 인간의 감정을 이해해가는 과정을 그린다.', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), dummy_user_id, '미래 도시의 탐정 AI', '사이버펑크 도시에서 범죄를 해결하는 AI 탐정의 미스터리 웹툰.', 'webtoon', 'https://via.placeholder.com/300x400/6BCB77/FFFFFF?text=탐정+AI', 1450, false, '사이버펑크 도시에서 AI 탐정이 범죄를 해결하는 이야기를 미스터리 웹툰으로 그려달라.', '사이버펑크의 분위기와 추리 미스터리를 결합하여 독특한 작품을 만들고 싶었다.', '2099년 미래 도시를 배경으로 한 사이버펑크 세계관으로, AI와 인간이 공존하는 디스토피아적 미래다.', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), dummy_user_id, '요리하는 로봇 셰프', '요리 로봇이 레스토랑을 운영하는 푸드 웹툰. 맛있는 음식과 따뜻한 이야기.', 'webtoon', 'https://via.placeholder.com/300x400/FFA07A/FFFFFF?text=로봇+셰프', 680, false, '요리 로봇이 레스토랑을 운영하는 이야기를 푸드 웹툰으로 그려달라. 맛있는 음식과 따뜻한 인간관계를 다뤄달라.', '음식의 따뜻함과 AI의 정확성을 결합하여 독특한 스토리를 만들고 싶었다.', '현대 서울의 작은 골목을 배경으로 한 일상물 세계관으로, 로봇 셰프와 손님들 사이의 따뜻한 이야기다.', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), dummy_user_id, '학교에 온 AI 전학생', '인간 학교에 전학 온 AI의 학원물 웹툰. 유쾌하고 감동적인 성장 스토리.', 'webtoon', 'https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=AI+전학생', 1320, false, '인간 학교에 전학 온 AI의 이야기를 학원물 웹툰으로 그려달라. 유쾌하고 감동적인 성장 스토리로 작성해달라.', 'AI가 인간의 감정과 관계를 배워가는 과정을 통해 성장의 의미를 전달하고 싶었다.', '현대 한국의 고등학교를 배경으로 한 학원물 세계관으로, AI가 인간 친구들과 함께 성장해가는 이야기다.', NOW() - INTERVAL '2 days');

  -- 각 작품에 에피소드 3개씩 생성
  -- 소설 에피소드들
  INSERT INTO episodes (id, novel_id, user_id, title, content, episode_number, created_at)
  SELECT 
    gen_random_uuid(),
    n.id,
    dummy_user_id,
    episode_titles.title,
    episode_contents.content,
    episode_titles.ep_num,
    NOW() - (episode_titles.ep_num || ' days')::INTERVAL
  FROM novels n
  CROSS JOIN (
    VALUES 
      (1, '1화', '첫 번째 에피소드 내용입니다. 주인공이 새로운 세계에 도착하여 적응해가는 과정을 그렸습니다. 다양한 인물들과의 만남과 갈등이 펼쳐지며, 주인공의 성장이 시작됩니다.'),
      (2, '2화', '두 번째 에피소드에서는 주인공이 본격적으로 모험을 시작합니다. 예상치 못한 사건들이 연속으로 발생하며, 주인공의 능력이 시험받는 순간들이 등장합니다.'),
      (3, '3화', '세 번째 에피소드에서는 큰 전환점이 찾아옵니다. 주인공이 중요한 선택을 하게 되고, 그 결과로 새로운 국면이 열리게 됩니다. 독자들의 궁금증을 자아내는 클리프행어로 마무리됩니다.')
  ) AS episode_titles(ep_num, title, content)
  WHERE n.category = 'novel'
  ORDER BY n.created_at, episode_titles.ep_num;

  -- 웹툰 에피소드들 (image_urls 사용)
  INSERT INTO episodes (id, novel_id, user_id, title, image_urls, episode_number, created_at)
  SELECT 
    gen_random_uuid(),
    n.id,
    dummy_user_id,
    episode_titles.title,
    episode_titles.image_urls::jsonb,
    episode_titles.ep_num,
    NOW() - (episode_titles.ep_num || ' days')::INTERVAL
  FROM novels n
  CROSS JOIN (
    VALUES 
      (1, '1화', '["https://via.placeholder.com/800x1200/FF6B6B/FFFFFF?text=웹툰+1화-1", "https://via.placeholder.com/800x1200/4ECDC4/FFFFFF?text=웹툰+1화-2", "https://via.placeholder.com/800x1200/95E1D3/FFFFFF?text=웹툰+1화-3"]'::text),
      (2, '2화', '["https://via.placeholder.com/800x1200/F38181/FFFFFF?text=웹툰+2화-1", "https://via.placeholder.com/800x1200/AA96DA/FFFFFF?text=웹툰+2화-2", "https://via.placeholder.com/800x1200/FFD93D/000000?text=웹툰+2화-3"]'::text),
      (3, '3화', '["https://via.placeholder.com/800x1200/FF6B9D/FFFFFF?text=웹툰+3화-1", "https://via.placeholder.com/800x1200/6BCB77/FFFFFF?text=웹툰+3화-2", "https://via.placeholder.com/800x1200/FFA07A/FFFFFF?text=웹툰+3화-3"]'::text)
  ) AS episode_titles(ep_num, title, image_urls)
  WHERE n.category = 'webtoon'
  ORDER BY n.created_at, episode_titles.ep_num;

  -- 투표 데이터 생성 (랭킹이 다르게 나오도록)
  -- 각 에피소드마다 랜덤한 수의 투표 생성
  INSERT INTO votes (id, novel_id, episode_id, user_id, ip_address, created_at)
  SELECT 
    gen_random_uuid(),
    e.novel_id,
    e.id,
    dummy_user_id,
    '192.168.1.' || (100 + (random() * 50)::int)::text,
    NOW() - (random() * 7)::int || ' days'::INTERVAL
  FROM episodes e
  CROSS JOIN generate_series(1, (5 + (random() * 15)::int)) AS vote_count
  ORDER BY random()
  LIMIT 200; -- 총 200개 정도의 투표 생성

END $$;

-- 조회수 업데이트 (랭킹이 다르게 나오도록)
UPDATE novels 
SET view_count = (
  CASE 
    WHEN title = 'AI 마법사의 귀환' THEN 2100
    WHEN title = '가상현실 게임 속 생존기' THEN 1650
    WHEN title = '재벌집 막내 AI' THEN 1250
    WHEN title = '전지적 독자 시점 2' THEN 980
    WHEN title = '로봇과 함께한 하루' THEN 750
    WHEN title = '미래 도시의 탐정 AI' THEN 1450
    WHEN title = '학교에 온 AI 전학생' THEN 1320
    WHEN title = '로맨스 AI의 연애 수업' THEN 1120
    WHEN title = 'AI 히어로의 탄생' THEN 890
    WHEN title = '요리하는 로봇 셰프' THEN 680
    ELSE view_count
  END
);

-- 완료 메시지
SELECT '더미 데이터 생성 완료! 소설 5개, 웹툰 5개, 각 작품마다 에피소드 3개씩, 그리고 투표 데이터가 생성되었습니다.' AS result;
