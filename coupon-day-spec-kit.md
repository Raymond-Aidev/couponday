# 쿠폰데이 (CouponDay) 개발 스펙킷

> PRD v1.0.0 기반 | 작성일: 2024-12-22

---

## 📋 목차

1. [프로젝트 요약](#1-프로젝트-요약)
2. [기술 스택 & 아키텍처](#2-기술-스택--아키텍처)
3. [데이터 모델 요약](#3-데이터-모델-요약)
4. [API 엔드포인트 매트릭스](#4-api-엔드포인트-매트릭스)
5. [핵심 비즈니스 로직](#5-핵심-비즈니스-로직)
6. [화면 & 기능 매핑](#6-화면--기능-매핑)
7. [구현 체크리스트](#7-구현-체크리스트)
8. [개발 환경 Quick Start](#8-개발-환경-quick-start)

---

## 1. 프로젝트 요약

### 1.1 핵심 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 쿠폰데이 (CouponDay) |
| **목표** | 소상공인 자체 쿠폰 마케팅 플랫폼 |
| **예상 기간** | 16주 (4개월) |
| **앱 종류** | 소상공인 앱 + 고객 앱 + 관리자 웹 |

### 1.2 핵심 혁신 기능 (USP)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 크로스 카테고리 쿠폰                                          │
│     "어제 돈까스 먹은 사람 → 오늘 김치찌개 할인"                    │
├─────────────────────────────────────────────────────────────────┤
│  2. 식사 피로도(Meal Fatigue) 활용                                │
│     카테고리 간 전환 확률 기반 파트너 매칭                          │
├─────────────────────────────────────────────────────────────────┤
│  3. 쿠폰 진화 시스템                                              │
│     쿠폰 성과가 템플릿으로 학습 → 집단 지성 형성                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 사용자 유형 & 가치

| 사용자 | 주요 기능 | 핵심 가치 |
|--------|----------|----------|
| **소상공인** | 쿠폰 생성/관리, 성과 분석, 파트너십 | AI 기반 맞춤 쿠폰 추천 |
| **소비자** | 주변 쿠폰 탐색, 저장, 사용, 크로스쿠폰 | 새로운 가게 발견 |
| **관리자** | 전체 시스템 관리, 통계 | 데이터 기반 정책 |

---

## 2. 기술 스택 & 아키텍처

### 2.1 기술 스택 매트릭스

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Mobile (소상공인/고객 앱)         │  Web (관리자)                │
│  ─────────────────────────────────┼────────────────────────────  │
│  • React Native                   │  • Next.js 14 (App Router)   │
│  • TypeScript                     │  • TypeScript                │
│  • Redux Toolkit                  │  • Tailwind CSS              │
│  • React Query                    │  • shadcn/ui                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│  • Node.js + Express/Fastify                                     │
│  • TypeScript                                                    │
│  • Prisma ORM                                                    │
│  • PostgreSQL 15+ (PostGIS)                                      │
│  • Redis (캐싱, 세션)                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE                               │
├─────────────────────────────────────────────────────────────────┤
│  • Docker + Kubernetes                                           │
│  • AWS/GCP                                                       │
│  • Firebase Cloud Messaging (푸시)                               │
│  • AWS S3 (이미지)                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 모노레포 구조

```
coupon-day/
├── apps/
│   ├── store-app/          # 소상공인 앱 (React Native)
│   ├── customer-app/       # 고객 앱 (React Native)
│   ├── admin-web/          # 관리자 웹 (Next.js)
│   └── api-server/         # API 서버 (Node.js)
│       └── src/modules/
│           ├── auth/       # 인증
│           ├── store/      # 점포
│           ├── coupon/     # 쿠폰
│           ├── customer/   # 고객
│           ├── partnership/# 파트너십
│           ├── cross-coupon/# 크로스쿠폰
│           └── analytics/  # 분석
├── packages/
│   ├── shared-types/       # 공유 타입
│   ├── shared-utils/       # 공유 유틸
│   └── ui-components/      # 공유 UI
├── docker/
└── docs/
```

### 2.3 시스템 아키텍처 다이어그램

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  소상공인 앱  │    │   고객 앱    │    │  관리자 웹   │
│ (React Native)│    │(React Native)│    │  (Next.js)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼───────┐
                    │   API Gateway │
                    │  (Express)    │
                    └──────┬───────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼───────┐    ┌──────▼───────┐    ┌──────▼───────┐
│  PostgreSQL  │    │    Redis     │    │     S3       │
│  + PostGIS   │    │   (Cache)    │    │   (Images)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 3. 데이터 모델 요약

### 3.1 ERD 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STORE DOMAIN                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────┐     ┌────────────────┐     ┌────────────┐                   │
│  │   Store    │────<│  StoreAccount  │     │    Item    │                   │
│  │            │     │   (사장님계정)  │     │   (메뉴)   │                   │
│  └─────┬──────┘     └────────────────┘     └─────┬──────┘                   │
│        │                                         │                          │
│        │     ┌────────────────────┐              │                          │
│        └────>│  StoreSalesPattern │              │                          │
│              │    (매출패턴)       │              │                          │
│              └────────────────────┘              │                          │
│                                                  │                          │
└──────────────────────────────────────────────────┼──────────────────────────┘
                                                   │
┌──────────────────────────────────────────────────┼──────────────────────────┐
│                              COUPON DOMAIN       │                          │
├──────────────────────────────────────────────────┼──────────────────────────┤
│                                                  │                          │
│  ┌────────────┐     ┌────────────────┐     ┌─────▼──────┐                   │
│  │   Coupon   │────<│   CouponItem   │────>│    Item    │                   │
│  │            │     │   (쿠폰-메뉴)   │     │            │                   │
│  └─────┬──────┘     └────────────────┘     └────────────┘                   │
│        │                                                                     │
│        │     ┌────────────────────┐     ┌────────────────────┐              │
│        ├────>│  CouponDailyStats  │     │  CouponPerformance │              │
│        │     │    (일별통계)       │     │     (성과분석)      │              │
│        │     └────────────────────┘     └────────────────────┘              │
│        │                                                                     │
│        │     ┌────────────────────┐                                         │
│        └────>│  CouponTemplate    │                                         │
│              │    (쿠폰템플릿)     │                                         │
│              └────────────────────┘                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER DOMAIN                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────┐     ┌────────────────┐     ┌────────────────┐                │
│  │  Customer  │────<│  SavedCoupon   │────>│    Coupon      │                │
│  │            │     │   (저장쿠폰)    │     │                │                │
│  └─────┬──────┘     └────────────────┘     └────────────────┘                │
│        │                                                                      │
│        │     ┌────────────────┐     ┌────────────────┐                       │
│        ├────>│  Redemption    │     │ FavoriteStore  │                       │
│        │     │   (사용기록)    │     │   (즐겨찾기)    │                       │
│        │     └────────────────┘     └────────────────┘                       │
│        │                                                                      │
└────────┼──────────────────────────────────────────────────────────────────────┘
         │
┌────────┼──────────────────────────────────────────────────────────────────────┐
│        │                    CROSS-COUPON DOMAIN                               │
├────────┼──────────────────────────────────────────────────────────────────────┤
│        │                                                                      │
│        │     ┌────────────────┐     ┌────────────────┐                       │
│        │     │  Partnership   │────>│  CrossCoupon   │                       │
│        │     │   (파트너십)    │     │  (크로스쿠폰)   │                       │
│        │     └───────┬────────┘     └───────┬────────┘                       │
│        │             │                      │                                │
│        │             │     ┌────────────────▼────────┐                       │
│        └─────────────┼────>│      MealToken         │                       │
│                      │     │      (식사토큰)         │                       │
│                      │     └────────────────────────┘                       │
│                      │                                                       │
│                      │     ┌────────────────────────┐                       │
│                      └────>│ CrossCouponSettlement  │                       │
│                            │       (정산)           │                       │
│                            └────────────────────────┘                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 테이블 스펙

#### Store (점포)

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| id | UUID | PK | ✓ |
| businessNumber | String | 사업자등록번호 (UNIQUE) | ✓ |
| name | String | 점포명 | ✓ |
| categoryId | UUID | 카테고리 FK | ✓ |
| latitude | Decimal(10,8) | 위도 | ✓ |
| longitude | Decimal(11,8) | 경도 | ✓ |
| status | Enum | ACTIVE/INACTIVE/SUSPENDED/CLOSED | ✓ |
| isVerified | Boolean | 인증 여부 | ✓ |

#### Coupon (쿠폰)

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| id | UUID | PK | ✓ |
| storeId | UUID | 점포 FK | ✓ |
| name | String | 쿠폰명 | ✓ |
| discountType | Enum | FIXED/PERCENTAGE/BOGO/BUNDLE/FREEBIE/CONDITIONAL | ✓ |
| discountValue | Int | 할인값 | |
| targetScope | Enum | ALL/CATEGORY/SPECIFIC | ✓ |
| validFrom | DateTime | 유효 시작 | ✓ |
| validUntil | DateTime | 유효 종료 | ✓ |
| availableDays | Int[] | 가능 요일 [0-6] | |
| availableTimeStart | String | 시작 시간 (HH:mm) | |
| availableTimeEnd | String | 종료 시간 (HH:mm) | |
| totalQuantity | Int | 총 수량 | |
| dailyLimit | Int | 일일 한도 | |
| perUserLimit | Int | 인당 한도 (기본 1) | ✓ |
| status | Enum | DRAFT/SCHEDULED/ACTIVE/PAUSED/ENDED | ✓ |

#### Partnership (파트너십)

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| id | UUID | PK | ✓ |
| distributorStoreId | UUID | 토큰 발급 점포 | ✓ |
| providerStoreId | UUID | 쿠폰 제공 점포 | ✓ |
| status | Enum | PENDING/ACTIVE/PAUSED/TERMINATED | ✓ |
| commissionPerRedemption | Int | 건당 수수료 (기본 500원) | ✓ |

#### MealToken (식사 토큰)

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|:----:|
| id | UUID | PK | ✓ |
| tokenCode | String | 8자리 코드 (UNIQUE) | ✓ |
| distributorStoreId | UUID | 발급 점포 | ✓ |
| expiresAt | DateTime | 만료 시간 (다음날 23:59:59) | ✓ |
| status | Enum | ISSUED/SELECTED/REDEEMED/EXPIRED | ✓ |
| selectedCrossCouponId | UUID | 선택한 크로스쿠폰 | |

### 3.3 Enum 정의 요약

```typescript
// 점포 상태
enum StoreStatus {
  ACTIVE      // 운영 중
  INACTIVE    // 비활성
  SUSPENDED   // 정지
  CLOSED      // 폐업
}

// 할인 타입
enum DiscountType {
  FIXED       // 정액 (예: 3000원 할인)
  PERCENTAGE  // 정률 (예: 10% 할인)
  BOGO        // 1+1
  BUNDLE      // 세트 할인
  FREEBIE     // 무료 증정
  CONDITIONAL // 조건부 (예: 2만원 이상 시)
}

// 쿠폰 상태
enum CouponStatus {
  DRAFT       // 초안
  SCHEDULED   // 예약
  ACTIVE      // 활성
  PAUSED      // 일시정지
  ENDED       // 종료
}

// 파트너십 상태
enum PartnershipStatus {
  PENDING     // 요청 중
  ACTIVE      // 활성
  PAUSED      // 일시정지
  TERMINATED  // 해지
}

// 토큰 상태
enum MealTokenStatus {
  ISSUED      // 발급됨
  SELECTED    // 쿠폰 선택됨
  REDEEMED    // 사용됨
  EXPIRED     // 만료
}
```

---

## 4. API 엔드포인트 매트릭스

### 4.1 인증 API

| Method | Endpoint | 설명 | 요청 Body | 응답 |
|:------:|----------|------|----------|------|
| POST | `/auth/store/register` | 점포 회원가입 | `{ businessNumber, phone, password, ownerName }` | `{ accessToken, refreshToken, store }` |
| POST | `/auth/store/login` | 점포 로그인 | `{ phone, password }` | `{ accessToken, refreshToken, store }` |
| POST | `/auth/store/refresh` | 토큰 갱신 | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/auth/customer/anonymous` | 비회원 세션 | `{ deviceId }` | `{ accessToken, customer }` |
| POST | `/auth/customer/social` | 소셜 로그인 | `{ provider, token }` | `{ accessToken, refreshToken, customer }` |

### 4.2 점포 API (소상공인)

| Method | Endpoint | 설명 | 인증 |
|:------:|----------|------|:----:|
| GET | `/store/me` | 내 점포 정보 | ✓ |
| PATCH | `/store/me` | 점포 정보 수정 | ✓ |
| GET | `/store/me/dashboard` | 대시보드 데이터 | ✓ |
| GET | `/store/me/sales-pattern` | 매출 패턴 | ✓ |

#### 메뉴 관리

| Method | Endpoint | 설명 | 인증 |
|:------:|----------|------|:----:|
| GET | `/store/me/items` | 메뉴 목록 | ✓ |
| POST | `/store/me/items` | 메뉴 추가 | ✓ |
| PATCH | `/store/me/items/:id` | 메뉴 수정 | ✓ |
| DELETE | `/store/me/items/:id` | 메뉴 삭제 | ✓ |

#### 쿠폰 관리

| Method | Endpoint | 설명 | 인증 |
|:------:|----------|------|:----:|
| GET | `/store/me/coupons` | 쿠폰 목록 | ✓ |
| GET | `/store/me/coupons/recommendations` | AI 쿠폰 추천 | ✓ |
| POST | `/store/me/coupons` | 쿠폰 생성 | ✓ |
| GET | `/store/me/coupons/:id` | 쿠폰 상세 | ✓ |
| PATCH | `/store/me/coupons/:id` | 쿠폰 수정 | ✓ |
| PATCH | `/store/me/coupons/:id/status` | 상태 변경 | ✓ |
| GET | `/store/me/coupons/:id/qr` | QR 코드 | ✓ |
| GET | `/store/me/coupons/:id/performance` | 성과 분석 | ✓ |

#### 파트너십 관리

| Method | Endpoint | 설명 | 인증 |
|:------:|----------|------|:----:|
| GET | `/store/me/partnerships` | 파트너 목록 | ✓ |
| GET | `/store/me/partnerships/recommendations` | AI 파트너 추천 | ✓ |
| POST | `/store/me/partnerships/requests` | 파트너십 요청 | ✓ |
| PATCH | `/store/me/partnerships/requests/:id` | 요청 응답 | ✓ |
| GET | `/store/me/partnerships/:id` | 파트너십 상세 | ✓ |
| GET | `/store/me/partnerships/:id/settlements` | 정산 내역 | ✓ |
| POST | `/store/me/tokens` | 토큰 발급 | ✓ |

### 4.3 고객 API

#### 쿠폰 탐색

| Method | Endpoint | 설명 | Query Params |
|:------:|----------|------|-------------|
| GET | `/customer/coupons/nearby` | 주변 쿠폰 | `lat, lng, radius, category, sort` |
| GET | `/customer/coupons/map` | 지도용 쿠폰 | `lat, lng, zoom, bounds` |
| GET | `/customer/coupons/:id` | 쿠폰 상세 | - |
| POST | `/customer/coupons/:id/save` | 쿠폰 저장 | - |

#### 내 쿠폰함

| Method | Endpoint | 설명 | Query Params |
|:------:|----------|------|-------------|
| GET | `/customer/me/coupons` | 내 쿠폰 목록 | `status, sort` |
| GET | `/customer/me/coupons/:id/qr` | 사용 QR | - |

#### 크로스 쿠폰

| Method | Endpoint | 설명 | 인증 |
|:------:|----------|------|:----:|
| GET | `/customer/tokens/:code/available-coupons` | 선택 가능 목록 | ✓ |
| POST | `/customer/tokens/:code/select` | 쿠폰 선택 | ✓ |
| GET | `/customer/me/tokens` | 내 토큰 목록 | ✓ |

### 4.4 사용 처리 API

| Method | Endpoint | 설명 | 호출 주체 |
|:------:|----------|------|----------|
| POST | `/redemptions` | 쿠폰 사용 처리 | 점포 |

**요청 Body:**
```json
{
  "savedCouponId": "uuid",
  "qrCode": "string",
  "orderAmount": 15000,
  "orderItems": [
    { "itemId": "uuid", "quantity": 1, "price": 8000 }
  ]
}
```

### 4.5 응답 형식

```typescript
// 성공 응답
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// 에러 응답
interface ErrorResponse {
  success: false;
  error: {
    code: string;    // 예: "COUPON_001"
    message: string; // 예: "이미 저장한 쿠폰입니다"
    details?: object;
  };
}
```

### 4.6 에러 코드 매트릭스

| 코드 | 메시지 | HTTP | 설명 |
|------|--------|:----:|------|
| AUTH_001 | 인증이 필요합니다 | 401 | 토큰 없음 |
| AUTH_002 | 토큰이 만료되었습니다 | 401 | 토큰 만료 |
| AUTH_003 | 유효하지 않은 토큰입니다 | 401 | 토큰 검증 실패 |
| COUPON_001 | 이미 저장한 쿠폰입니다 | 409 | 중복 저장 |
| COUPON_002 | 수량이 소진되었습니다 | 410 | 총 수량 소진 |
| COUPON_003 | 오늘 수량이 소진되었습니다 | 410 | 일일 한도 |
| COUPON_004 | 지금은 사용할 수 없는 시간입니다 | 400 | 시간 제한 |
| COUPON_005 | 이미 사용된 쿠폰입니다 | 400 | 중복 사용 |
| COUPON_006 | 만료된 쿠폰입니다 | 410 | 기간 만료 |
| CROSS_001 | 이미 쿠폰을 선택했습니다 | 409 | 중복 선택 |
| CROSS_002 | 토큰이 만료되었습니다 | 410 | 토큰 만료 |
| PARTNER_001 | 이미 파트너십이 존재합니다 | 409 | 중복 파트너십 |
| PARTNER_002 | 자기 자신과는 파트너십을 맺을 수 없습니다 | 400 | 자기 참조 |

---

## 5. 핵심 비즈니스 로직

### 5.1 쿠폰 사용 가능 여부 판단 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    쿠폰 사용 가능 여부 체크                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ 1. 쿠폰 상태 체크 │
                    │ status = ACTIVE? │
                    └────────┬────────┘
                             │ No → "COUPON_NOT_ACTIVE"
                             ▼ Yes
                    ┌─────────────────┐
                    │ 2. 유효기간 체크  │
                    │ validFrom~Until │
                    └────────┬────────┘
                             │ No → "NOT_STARTED_YET" / "EXPIRED"
                             ▼ Yes
                    ┌─────────────────┐
                    │ 3. 요일 체크     │
                    │ availableDays   │
                    └────────┬────────┘
                             │ No → "NOT_AVAILABLE_TODAY"
                             ▼ Yes
                    ┌─────────────────┐
                    │ 4. 시간 체크     │
                    │ timeStart~End   │
                    └────────┬────────┘
                             │ No → "NOT_AVAILABLE_NOW"
                             ▼ Yes
                    ┌─────────────────┐
                    │ 5. 블랙아웃 체크 │
                    │ blackoutDates   │
                    └────────┬────────┘
                             │ No → "BLACKOUT_DATE"
                             ▼ Yes
                    ┌─────────────────┐
                    │ 6. 총 수량 체크  │
                    │ totalQuantity   │
                    └────────┬────────┘
                             │ No → "SOLD_OUT"
                             ▼ Yes
                    ┌─────────────────┐
                    │ 7. 일일 한도 체크 │
                    │ dailyLimit      │
                    └────────┬────────┘
                             │ No → "DAILY_LIMIT_REACHED"
                             ▼ Yes
                    ┌─────────────────┐
                    │   ✅ 사용 가능   │
                    └─────────────────┘
```

### 5.2 쿠폰 성과(ROI) 계산

```
┌─────────────────────────────────────────────────────────────────┐
│                       ROI 계산 공식                              │
└─────────────────────────────────────────────────────────────────┘

1. 기준선 (Baseline)
   = 전월 동기간 동일 조건 매출
   
2. 매출 증분 (Sales Lift)
   = 실제 매출 - 기준선 매출
   
3. 할인 비용 (Discount Cost)
   = Σ(사용건 × 할인금액)
   
4. 순효과 (Net Effect)
   = 매출 증분 - 할인 비용
   
5. ROI
   = 순효과 / 할인 비용

┌─────────────────────────────────────────────────────────────────┐
│ 예시:                                                            │
│   기준선: 1,000,000원                                            │
│   실제 매출: 1,500,000원                                         │
│   할인 비용: 200,000원                                           │
│                                                                  │
│   매출 증분 = 1,500,000 - 1,000,000 = 500,000원                  │
│   순효과 = 500,000 - 200,000 = 300,000원                         │
│   ROI = 300,000 / 200,000 = 1.5 (150%)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 파트너 매칭 점수 계산

```
┌─────────────────────────────────────────────────────────────────┐
│                    파트너 매칭 점수 (총 100점)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┬──────┬────────────────────────────────────┐
│ 기준                │ 배점 │ 계산 방식                          │
├─────────────────────┼──────┼────────────────────────────────────┤
│ 카테고리 전환율     │ 40점 │ 피로도 매트릭스 전환 확률 × 40     │
├─────────────────────┼──────┼────────────────────────────────────┤
│ 거리                │ 20점 │ 100-300m: 20점                     │
│                     │      │ 50-100m / 300-400m: 15점           │
│                     │      │ <50m / 400-500m: 10점              │
│                     │      │ >500m: 0점                         │
├─────────────────────┼──────┼────────────────────────────────────┤
│ 가격대 유사성       │ 20점 │ 객단가 차이 ±30% 이내: 20점        │
│                     │      │ ±30-50%: 10점                      │
│                     │      │ >50%: 0점                          │
├─────────────────────┼──────┼────────────────────────────────────┤
│ 피크 시간 일치      │ 20점 │ 동일 피크타임: 20점                │
│                     │      │ 1시간 차이: 10점                   │
│                     │      │ 2시간 이상: 0점                    │
└─────────────────────┴──────┴────────────────────────────────────┘
```

### 5.4 토큰 코드 생성 규칙

```
┌─────────────────────────────────────────────────────────────────┐
│                      토큰 코드 규칙                              │
└─────────────────────────────────────────────────────────────────┘

• 알파벳: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
  (제외: 0, O, I, l, 1 - 혼동 방지)
  
• 길이: 8자리

• 예시: ABC123XY, 7KMN9P2Q

• 만료: 발급 다음날 23:59:59

• 생성 알고리즘:
  1. nanoid로 8자리 코드 생성
  2. DB에서 중복 확인
  3. 중복 시 재생성 (최대 10회)
  4. 10회 초과 시 에러
```

### 5.5 크로스 쿠폰 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    크로스 쿠폰 전체 플로우                        │
└─────────────────────────────────────────────────────────────────┘

[1] 파트너십 설정
    점포 A (돈까스) ←──파트너십──→ 점포 B (김치찌개)
    
[2] 토큰 발급 (점포 A)
    고객이 점포 A에서 식사 후
    → 점포 A가 MealToken 발급 (QR 코드)
    → 토큰코드: "ABC123XY" (다음날까지 유효)

[3] 쿠폰 선택 (고객)
    고객이 토큰 QR 스캔
    → 선택 가능한 CrossCoupon 목록 표시
    → 점포 B의 "김치찌개 2000원 할인" 선택

[4] 쿠폰 사용 (점포 B)
    고객이 점포 B 방문
    → 선택한 크로스쿠폰 QR 표시
    → 점포 B가 스캔하여 사용 처리

[5] 정산 (자동)
    점포 A → 점포 B: 건당 500원 수수료
    (월별 정산)
```

---

## 6. 화면 & 기능 매핑

### 6.1 소상공인 앱 화면 매트릭스

| 화면 ID | 화면명 | 주요 기능 | API 연동 |
|---------|--------|----------|----------|
| S-001 | 스플래시 | 앱 로딩, 자동 로그인 | `/auth/store/refresh` |
| S-002 | 로그인 | 휴대폰 + 비밀번호 | `/auth/store/login` |
| S-003 | 회원가입 | 사업자번호 확인 → 정보 입력 | 국세청 API, `/auth/store/register` |
| S-010 | 홈 (대시보드) | 오늘 매출, 활성 쿠폰, AI 추천 | `/store/me/dashboard` |
| S-020 | 쿠폰 목록 | 운영중/예약/종료 탭 | `/store/me/coupons` |
| S-021 | 쿠폰 상세 | 쿠폰 정보 + 성과 요약 | `/store/me/coupons/:id` |
| S-022 | 쿠폰 생성 진입 | AI추천/템플릿/직접설계 선택 | - |
| S-023 | AI 쿠폰 추천 | 추천 쿠폰 목록 | `/store/me/coupons/recommendations` |
| S-024~28 | 쿠폰 생성 Step1~5 | 메뉴→할인→시간→수량→확인 | `/store/me/coupons` (POST) |
| S-029 | 쿠폰 성과 분석 | ROI, 차트, 인사이트 | `/store/me/coupons/:id/performance` |
| S-030 | 파트너십 목록 | 내 파트너 현황 | `/store/me/partnerships` |
| S-031 | 파트너 찾기 | AI 추천 파트너 | `/store/me/partnerships/recommendations` |
| S-032 | 파트너 상세 | 파트너 정보 + 성과 | `/store/me/partnerships/:id` |
| S-033 | 파트너 요청 | 요청 보내기/받기 | `/store/me/partnerships/requests` |
| S-040 | 메뉴 관리 | 메뉴 CRUD | `/store/me/items` |
| S-050 | 설정 | 가게 정보, 알림 설정 | `/store/me` (PATCH) |

### 6.2 고객 앱 화면 매트릭스

| 화면 ID | 화면명 | 주요 기능 | API 연동 |
|---------|--------|----------|----------|
| C-001 | 스플래시 | 앱 로딩 | `/auth/customer/anonymous` |
| C-002 | 온보딩 | 앱 소개 (첫 실행) | - |
| C-003 | 위치 권한 | 위치 권한 요청 | - |
| C-010 | 홈 | 주변 쿠폰, 카테고리, 검색 | `/customer/coupons/nearby` |
| C-020 | 지도 | 쿠폰 마커 지도 | `/customer/coupons/map` |
| C-021 | 지도 프리뷰 | 마커 탭 시 바텀시트 | `/customer/coupons/:id` |
| C-030 | 가게 상세 | 가게 정보 + 쿠폰 목록 | `/customer/stores/:id` |
| C-031 | 쿠폰 받기 완료 | 저장 완료 애니메이션 | `/customer/coupons/:id/save` |
| C-040 | 내 쿠폰함 | 저장한 쿠폰 목록 | `/customer/me/coupons` |
| C-041 | 쿠폰 사용 (QR) | QR 코드 표시 | `/customer/me/coupons/:id/qr` |
| C-050 | 오늘의 선택 | 크로스 쿠폰 탭 | `/customer/me/tokens` |
| C-051 | 토큰 스캔 | QR 스캔 화면 | - |
| C-052 | 쿠폰 선택 | 선택 가능한 쿠폰 목록 | `/customer/tokens/:code/available-coupons` |
| C-053 | 선택 완료 | 선택 완료 화면 | `/customer/tokens/:code/select` |
| C-060 | 마이페이지 | 프로필, 통계, 설정 | `/customer/me` |

---

## 7. 구현 체크리스트

### Phase 1: 기반 구축 (2주)

```
□ 1.1 프로젝트 초기화
  □ Turborepo 모노레포 설정
  □ ESLint + Prettier 설정
  □ TypeScript 설정
  □ CI/CD 파이프라인 (GitHub Actions)

□ 1.2 데이터베이스 설정
  □ PostgreSQL + PostGIS Docker 설정
  □ Prisma 스키마 작성
  □ 마이그레이션 실행
  □ Seed 데이터 작성

□ 1.3 API 서버 기본 구조
  □ Express/Fastify 설정
  □ 공통 미들웨어 (CORS, 에러핸들링, 로깅)
  □ Swagger/OpenAPI 문서화
  □ 응답 형식 표준화

□ 1.4 인증 모듈
  □ JWT 발급/검증 유틸
  □ 점포 회원가입 API
  □ 점포 로그인 API
  □ 리프레시 토큰 로직
  □ 고객 익명 세션 API
```

### Phase 2: 핵심 기능 - 점포 (2주)

```
□ 2.1 점포 관리 API
  □ GET /store/me
  □ PATCH /store/me
  □ 이미지 업로드 (S3)
  □ GET /store/me/dashboard

□ 2.2 메뉴 관리 API
  □ CRUD /store/me/items
  □ 카테고리 관리

□ 2.3 쿠폰 관리 API
  □ CRUD /store/me/coupons
  □ QR 코드 생성
  □ 상태 변경 API
  □ 쿠폰 사용 가능 여부 로직

□ 2.4 AI 쿠폰 추천
  □ 매출 패턴 분석 로직
  □ 취약 시간대 감지
  □ 템플릿 매칭 알고리즘
  □ GET /store/me/coupons/recommendations

□ 2.5 쿠폰 성과 분석
  □ 기준선 계산 로직
  □ ROI 계산 로직
  □ 일별 통계 집계
  □ GET /store/me/coupons/:id/performance
```

### Phase 3: 핵심 기능 - 고객 (2주)

```
□ 3.1 쿠폰 조회 API
  □ GET /customer/coupons/nearby (PostGIS)
  □ GET /customer/coupons/map
  □ 카테고리 필터링
  □ 정렬 옵션

□ 3.2 쿠폰 저장 & 사용
  □ POST /customer/coupons/:id/save
  □ GET /customer/me/coupons
  □ GET /customer/me/coupons/:id/qr
  □ POST /redemptions (사용 처리)

□ 3.3 가게 조회
  □ GET /customer/stores/search
  □ GET /customer/stores/:id
  □ 즐겨찾기 기능

□ 3.4 푸시 알림
  □ FCM 설정
  □ 디바이스 토큰 관리
  □ 알림 발송 서비스
```

### Phase 4: 크로스 쿠폰 시스템 (2주)

```
□ 4.1 파트너십 관리
  □ 파트너 매칭 알고리즘
  □ GET /store/me/partnerships/recommendations
  □ POST /store/me/partnerships/requests
  □ PATCH /store/me/partnerships/requests/:id

□ 4.2 크로스 쿠폰 설정
  □ CrossCoupon CRUD
  □ 파트너십 연결 로직

□ 4.3 식사 토큰 시스템
  □ POST /store/me/tokens (발급)
  □ 토큰 코드 생성 (nanoid)
  □ GET /customer/tokens/:code/available-coupons
  □ POST /customer/tokens/:code/select

□ 4.4 정산 시스템
  □ 정산 집계 스케줄러 (월별)
  □ GET /store/me/partnerships/:id/settlements
```

### Phase 5: 소상공인 앱 (3주)

```
□ 5.1 RN 프로젝트 설정
  □ React Native + TypeScript
  □ React Navigation
  □ Redux Toolkit + React Query
  □ 환경 설정

□ 5.2 인증 화면
  □ S-001 스플래시
  □ S-002 로그인
  □ S-003 회원가입

□ 5.3 홈 (대시보드)
  □ S-010 대시보드 UI
  □ 매출 차트
  □ AI 추천 알림

□ 5.4 쿠폰 관리 화면
  □ S-020 쿠폰 목록
  □ S-021 쿠폰 상세
  □ S-022~28 쿠폰 생성 플로우
  □ QR 표시

□ 5.5 쿠폰 성과 분석 화면
  □ S-029 성과 분석 UI
  □ 차트 구현

□ 5.6 파트너십 화면
  □ S-030 파트너 목록
  □ S-031 파트너 찾기
  □ S-032 파트너 상세
  □ S-033 요청 관리

□ 5.7 설정 & 기타
  □ S-040 메뉴 관리
  □ S-050 설정
```

### Phase 6: 고객 앱 (3주)

```
□ 6.1 RN 프로젝트 설정
  □ React Native 설정
  □ 위치 권한 처리
  □ 지도 연동 (react-native-maps)

□ 6.2 홈 화면
  □ C-010 홈 UI
  □ 위치 기반 쿠폰 리스트
  □ 카테고리 필터
  □ 검색

□ 6.3 지도 화면
  □ C-020 지도 UI
  □ 쿠폰 마커
  □ 클러스터링
  □ C-021 프리뷰 바텀시트

□ 6.4 가게 상세 & 쿠폰 받기
  □ C-030 가게 상세
  □ C-031 쿠폰 받기 완료

□ 6.5 내 쿠폰함
  □ C-040 쿠폰 목록
  □ C-041 QR 표시

□ 6.6 크로스 쿠폰
  □ C-050 오늘의 선택
  □ C-051 토큰 스캔
  □ C-052 쿠폰 선택
  □ C-053 선택 완료

□ 6.7 마이페이지 & 설정
  □ C-060 마이페이지
```

### Phase 7: 테스트 & 배포 (2주)

```
□ 7.1 API 테스트
  □ Unit 테스트 (Jest)
  □ Integration 테스트
  □ 커버리지 80% 달성

□ 7.2 프론트엔드 테스트
  □ 컴포넌트 테스트
  □ E2E 테스트 (Detox)

□ 7.3 배포 환경 구성
  □ Kubernetes 설정
  □ Helm Charts
  □ 모니터링 (Prometheus/Grafana)
  □ 로깅 (ELK)

□ 7.4 앱 스토어 배포
  □ iOS App Store 등록
  □ Google Play Store 등록
```

---

## 8. 개발 환경 Quick Start

### 8.1 필수 환경

```bash
# 필수 설치
- Node.js 18+
- Docker & Docker Compose
- pnpm (권장) 또는 npm
```

### 8.2 프로젝트 클론 & 설정

```bash
# 1. 클론
git clone https://github.com/your-org/coupon-day.git
cd coupon-day

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 4. Docker 서비스 시작
docker-compose -f docker/docker-compose.yml up -d

# 5. DB 마이그레이션
pnpm --filter api-server prisma migrate dev

# 6. Seed 데이터
pnpm --filter api-server prisma db seed
```

### 8.3 개발 서버 실행

```bash
# API 서버
pnpm --filter api-server dev

# 소상공인 앱 (Metro)
pnpm --filter store-app start

# 고객 앱 (Metro)
pnpm --filter customer-app start

# 관리자 웹
pnpm --filter admin-web dev
```

### 8.4 환경 변수 예시

```bash
# Database
DATABASE_URL="postgresql://couponday:couponday_dev_password@localhost:5432/coupon_day"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="30d"

# AWS
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="coupon-day-images"

# Firebase
FIREBASE_PROJECT_ID="your-project-id"

# App
NODE_ENV="development"
PORT=3000
```

### 8.5 유용한 명령어

```bash
# 전체 테스트
pnpm test

# 린트
pnpm lint

# 타입 체크
pnpm typecheck

# Prisma Studio (DB GUI)
pnpm --filter api-server prisma studio

# 빌드
pnpm build
```

---

## 부록: 참조 링크

| 문서 | 경로 |
|------|------|
| API 상세 명세 | `/docs/api/README.md` |
| 데이터베이스 ERD | `/docs/database/erd.md` |
| 화면 와이어프레임 | `/docs/wireframes/` |
| 디자인 시스템 | `/docs/design-system/` |

---

*이 스펙킷은 PRD v1.0.0을 기반으로 작성되었습니다.*
