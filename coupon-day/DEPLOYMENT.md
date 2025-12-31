# CouponDay 배포 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [Docker 배포](#docker-배포)
4. [프로덕션 배포](#프로덕션-배포)
5. [환경 변수](#환경-변수)
6. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
7. [모니터링](#모니터링)
8. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 최소 사양
- **OS**: Ubuntu 20.04 LTS 이상 / macOS 12+
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Node.js**: 20.x LTS
- **pnpm**: 8.15+

### 권장 사양 (프로덕션)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Database**: PostgreSQL 15+ (with PostGIS)
- **Cache**: Redis 7+

---

## 로컬 개발 환경

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/coupon-day.git
cd coupon-day
```

### 2. 의존성 설치

```bash
# pnpm 설치 (필요시)
npm install -g pnpm

# 의존성 설치
pnpm install
```

### 3. 환경 변수 설정

```bash
# API 서버 환경 변수
cp apps/api-server/.env.example apps/api-server/.env
# 필요한 값 수정
```

### 4. 데이터베이스 실행 (Docker)

```bash
cd docker
docker-compose up -d postgres redis
```

### 5. 데이터베이스 마이그레이션

```bash
cd apps/api-server
pnpm prisma migrate dev
pnpm prisma generate
```

### 6. 개발 서버 실행

```bash
# 루트 디렉토리에서
pnpm dev
```

---

## Docker 배포

### 개발 환경

```bash
cd docker
docker-compose up -d
```

### 프로덕션 환경

1. 환경 변수 파일 생성:

```bash
cd docker
cp .env.example .env
# .env 파일에 실제 값 입력
```

2. 프로덕션 컨테이너 실행:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. Nginx 포함 실행:

```bash
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

### Docker 이미지 빌드

```bash
# 개발용
docker build -t coupon-day-api:dev -f docker/Dockerfile.api .

# 프로덕션용
docker build -t coupon-day-api:prod -f docker/Dockerfile.api.prod .
```

---

## 프로덕션 배포

### AWS EC2 / VPS 배포

1. **서버 준비**:
   ```bash
   # Docker 설치
   curl -fsSL https://get.docker.com | sh

   # Docker Compose 설치
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **코드 배포**:
   ```bash
   git clone https://github.com/your-org/coupon-day.git /opt/coupon-day
   cd /opt/coupon-day/docker
   cp .env.example .env
   # .env 파일 수정
   ```

3. **SSL 인증서 설정** (Let's Encrypt):
   ```bash
   # Certbot 설치
   sudo apt install certbot

   # 인증서 발급
   sudo certbot certonly --standalone -d yourdomain.com

   # 인증서 복사
   cp /etc/letsencrypt/live/yourdomain.com/* /opt/coupon-day/docker/nginx/ssl/
   ```

4. **서비스 시작**:
   ```bash
   docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
   ```

### Kubernetes 배포

Kubernetes 배포를 위한 Helm 차트는 `kubernetes/` 디렉토리에 있습니다.

```bash
# Helm 차트 설치
helm install coupon-day ./kubernetes/helm/coupon-day \
  --set postgres.password=YOUR_PASSWORD \
  --set redis.password=YOUR_REDIS_PASSWORD \
  --set api.jwtSecret=YOUR_JWT_SECRET
```

---

## 환경 변수

### API 서버 (`apps/api-server/.env`)

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| `NODE_ENV` | 환경 (development/production/test) | O | development |
| `PORT` | 서버 포트 | O | 3000 |
| `HOST` | 서버 호스트 | O | 0.0.0.0 |
| `API_VERSION` | API 버전 | O | v1 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | O | - |
| `REDIS_URL` | Redis 연결 문자열 | O | - |
| `JWT_SECRET` | JWT 서명 키 (최소 32자) | O | - |
| `JWT_EXPIRES_IN` | Access Token 만료 시간 | O | 1h |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 만료 시간 | O | 7d |
| `CORS_ORIGINS` | 허용된 CORS 도메인 | O | * |

### Docker Compose (`docker/.env`)

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `POSTGRES_USER` | PostgreSQL 사용자명 | O |
| `POSTGRES_PASSWORD` | PostgreSQL 비밀번호 | O |
| `POSTGRES_DB` | 데이터베이스 이름 | O |
| `REDIS_PASSWORD` | Redis 비밀번호 | O |

---

## 데이터베이스 마이그레이션

### 새 마이그레이션 생성

```bash
cd apps/api-server
pnpm prisma migrate dev --name your_migration_name
```

### 프로덕션 마이그레이션 적용

```bash
# 로컬에서 실행
DATABASE_URL="postgresql://user:password@host:5432/db" pnpm prisma migrate deploy

# Docker 컨테이너 내에서 실행
docker exec -it coupon-day-api npx prisma migrate deploy
```

### 시드 데이터 실행

```bash
pnpm prisma db seed
```

---

## 모니터링

### 헬스 체크

```bash
curl http://localhost:3000/health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 로그 확인

```bash
# Docker 로그
docker logs -f coupon-day-api

# 실시간 로그
docker-compose -f docker-compose.prod.yml logs -f api
```

### 권장 모니터링 도구

- **APM**: DataDog, New Relic
- **로그**: ELK Stack, Loki
- **메트릭**: Prometheus + Grafana
- **알림**: PagerDuty, Slack

---

## 문제 해결

### 일반적인 문제

**1. 데이터베이스 연결 오류**
```
Error: P1001: Can't reach database server
```
- DATABASE_URL 확인
- PostgreSQL 서비스 상태 확인
- 방화벽/보안 그룹 설정 확인

**2. Redis 연결 오류**
```
Error: Connection refused - connect ECONNREFUSED
```
- REDIS_URL 확인
- Redis 서비스 상태 확인

**3. JWT 오류**
```
Error: secretOrPrivateKey must have a value
```
- JWT_SECRET 환경 변수 확인 (최소 32자)

**4. 포트 충돌**
```
Error: listen EADDRINUSE: address already in use :::3000
```
- 다른 프로세스가 포트 사용 중
- `lsof -i :3000` 으로 확인 후 종료

### 성능 최적화

1. **데이터베이스 인덱스 확인**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'your_table';
   ```

2. **Redis 캐시 모니터링**
   ```bash
   redis-cli INFO memory
   ```

3. **Node.js 메모리 증가**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" node dist/index.js
   ```

---

## 백업 및 복구

### 데이터베이스 백업

```bash
# 전체 백업
docker exec coupon-day-postgres pg_dump -U couponday coupon_day > backup.sql

# 특정 테이블만
docker exec coupon-day-postgres pg_dump -U couponday -t stores coupon_day > stores_backup.sql
```

### 데이터베이스 복구

```bash
docker exec -i coupon-day-postgres psql -U couponday coupon_day < backup.sql
```

---

## 연락처

- **기술 지원**: support@couponday.com
- **긴급 연락**: +82-10-XXXX-XXXX
