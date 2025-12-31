# CouponDay (쿠폰데이)

소상공인 쿠폰 생태계 플랫폼

## Quick Start

### 1. 환경 설정

```bash
# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
```

### 2. Docker 서비스 시작

```bash
# PostgreSQL + Redis 시작
docker-compose -f docker/docker-compose.yml up -d postgres redis
```

### 3. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
pnpm --filter @coupon-day/api-server prisma generate

# 마이그레이션 실행
pnpm --filter @coupon-day/api-server prisma migrate dev

# 시드 데이터 입력
pnpm --filter @coupon-day/api-server db:seed
```

### 4. 개발 서버 실행

```bash
# API 서버 실행
pnpm --filter @coupon-day/api-server dev
```

API 서버: http://localhost:3000
API 문서: http://localhost:3000/docs

## 테스트 계정

### 소상공인 (점포)
- 휴대폰: `01012345678`
- 비밀번호: `test1234`

## 프로젝트 구조

```
coupon-day/
├── apps/
│   ├── api-server/        # Fastify API 서버
│   ├── store-app/         # 소상공인 앱 (React Native)
│   └── customer-app/      # 고객 앱 (React Native)
├── packages/
│   ├── shared-types/      # 공유 타입
│   └── shared-utils/      # 공유 유틸리티
├── docker/                # Docker 설정
└── docs/                  # 문서
```

## 기술 스택

- **Backend**: Fastify, TypeScript, Prisma, PostgreSQL, Redis
- **Mobile**: React Native, TypeScript
- **Infrastructure**: Docker, Kubernetes

## 주요 기능

- 쿠폰 생성 및 관리
- AI 기반 쿠폰 추천
- 크로스 카테고리 쿠폰 (파트너십)
- 쿠폰 성과 분석 (ROI)
