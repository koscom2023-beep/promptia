# DevOps 체크리스트

## 배포 전 확인사항

### 1. 환경 변수 설정

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] `NEXT_PUBLIC_SITE_URL` 설정
- [ ] `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 설정 (AdSense 사용 시)
- [ ] `NEXT_PUBLIC_R2_PUBLIC_URL` 설정 (R2 사용 시)
- [ ] `R2_ACCOUNT_ID` 설정 (R2 사용 시, Encrypted)
- [ ] `R2_ACCESS_KEY_ID` 설정 (R2 사용 시, Encrypted)
- [ ] `R2_SECRET_ACCESS_KEY` 설정 (R2 사용 시, Encrypted)
- [ ] `R2_BUCKET_NAME` 설정 (R2 사용 시, Encrypted)

### 2. 데이터베이스 설정

- [ ] `create_tables_final.sql` 실행 완료
- [ ] `create_hierarchical_comments.sql` 실행 완료
- [ ] `create_ranking_system_final.sql` 실행 완료
- [ ] pg_cron 확장 활성화 확인
- [ ] Materialized View 생성 확인
- [ ] 랭킹 갱신 스케줄 확인

### 3. 타입 동기화

- [ ] `SUPABASE_PROJECT_ID` 환경 변수 설정
- [ ] `npm run sync-types` 실행
- [ ] `types/supabase.ts` 파일 생성 확인
- [ ] 타입 에러 없음 확인

### 4. 빌드 체크

- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run build` 성공
- [ ] 빌드 에러 없음

### 5. 기능 테스트

- [ ] 홈페이지 로드 확인
- [ ] 작품 목록 표시 확인
- [ ] 작품 상세 페이지 확인
- [ ] 댓글 작성 확인
- [ ] 대댓글 작성 확인
- [ ] 투표 기능 확인
- [ ] 광고 표시 확인 (AdSense 사용 시)
- [ ] 이미지 로드 확인

### 6. SEO 확인

- [ ] `/sitemap.xml` 접근 가능
- [ ] `/robots.txt` 접근 가능
- [ ] 메타데이터 확인 (OpenGraph, Twitter Card)
- [ ] 구조화된 데이터 확인 (JSON-LD)

### 7. 성능 확인

- [ ] Core Web Vitals 확인
- [ ] CLS 점수 확인 (0.1 이하 목표)
- [ ] LCP 확인 (2.5초 이하 목표)
- [ ] 이미지 최적화 확인

## 배포 후 확인사항

- [ ] 사이트 접속 확인
- [ ] 환경 변수 적용 확인
- [ ] 데이터베이스 연결 확인
- [ ] 랭킹 시스템 작동 확인
- [ ] 광고 표시 확인
- [ ] 에러 로그 확인

## 문제 발생 시

1. Vercel 배포 로그 확인
2. 환경 변수 확인
3. 데이터베이스 연결 확인
4. 타입 에러 확인
5. 빌드 에러 확인
