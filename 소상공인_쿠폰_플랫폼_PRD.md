# 소상공인 쿠폰 생태계 플랫폼 PRD

## Product Requirements Document (PRD)

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 쿠폰데이 (CouponDay) |
| **버전** | 1.0.1 |
| **작성일** | 2024-12-17 |
| **최종수정일** | 2024-12-31 |
| **상태** | Draft |

---

## 목차

1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [데이터베이스 스키마](#3-데이터베이스-스키마)
4. [API 명세](#4-api-명세)
5. [구현 작업 명세](#5-구현-작업-명세)
6. [화면 설계 명세](#6-화면-설계-명세)
7. [비즈니스 로직 상세](#7-비즈니스-로직-상세)
8. [환경 설정](#8-환경-설정)
9. [코딩 규칙](#9-코딩-규칙)
10. [테스트 전략](#10-테스트-전략)
11. [마일스톤](#11-마일스톤)

---

## 1. 개요

### 1.1 프로젝트 배경

한국의 소상공인들은 대형 플랫폼에 의존하지 않는 자체적인 마케팅 도구가 부족한 상황이다. 본 프로젝트는 팔란티어 온톨로지 기반의 데이터 모델을 활용하여 소상공인들이 쉽게 쿠폰을 설계, 배포, 분석할 수 있는 통합 플랫폼을 구축한다.

### 1.2 핵심 가치 제안

| 대상 | 가치 |
|------|------|
| **소상공인** | AI 기반 맞춤 쿠폰 추천, 성과 분석, 파트너십을 통한 고객 유치 |
| **소비자** | 주변 맛집 할인 쿠폰, 크로스 쿠폰을 통한 새로운 가게 발견 |
| **정부** | 소상공인 경제 데이터 확보, 정책 효과 측정 |

### 1.3 핵심 혁신 기능

| 기능 | 설명 |
|------|------|
| **크로스 카테고리 쿠폰** | "어제 돈까스 먹은 사람 → 오늘 김치찌개 할인" |
| **식사 피로도(Meal Fatigue) 활용** | 카테고리 간 전환 확률 기반 파트너 매칭 |
| **쿠폰 진화 시스템** | 쿠폰 성과가 템플릿으로 학습되어 집단 지성 형성 |

---

## 2. 시스템 아키텍처

### 2.1 기술 스택

```yaml
Frontend:
  Mobile:
    - React Native (iOS, Android 크로스 플랫폼)
    - TypeScript
    - Redux Toolkit (상태 관리)
    - React Query (서버 상태)
  Web:
    - Next.js 14 (App Router)
    - TypeScript
    - Tailwind CSS
    - shadcn/ui

Backend:
  API Server:
    - Node.js + Express 또는 Fastify
    - TypeScript
    - Prisma ORM
  Database:
    - PostgreSQL 15+ (메인 DB)
    - PostGIS (위치 기반)
    - Redis (캐싱, 세션)
  Infrastructure:
    - Docker + Kubernetes
    - AWS 또는 GCP

External Services:
  - Firebase Cloud Messaging (푸시 알림)
  - AWS S3 (이미지 저장)
  - 국세청 API (사업자 확인)
  - 기상청 API (날씨 연동)
```

### 2.2 프로젝트 구조

```
coupon-day/
├── apps/
│   ├── store-app/              # 소상공인 앱 (React Native)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── customer-app/           # 고객 앱 (React Native)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── admin-web/              # 관리자 웹 (Next.js)
│   │   └── ...
│   │
│   └── api-server/             # API 서버 (Node.js)
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── store/
│       │   │   ├── coupon/
│       │   │   ├── customer/
│       │   │   ├── partnership/
│       │   │   ├── cross-coupon/
│       │   │   └── analytics/
│       │   ├── common/
│       │   │   ├── middleware/
│       │   │   ├── guards/
│       │   │   ├── decorators/
│       │   │   └── utils/
│       │   ├── database/
│       │   │   ├── prisma/
│       │   │   └── migrations/
│       │   └── config/
│       └── package.json
│
├── packages/
│   ├── shared-types/           # 공유 타입 정의
│   ├── shared-utils/           # 공유 유틸리티
│   └── ui-components/          # 공유 UI 컴포넌트
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── docs/
│   ├── api/
│   ├── database/
│   └── architecture/
│
├── package.json
├── turbo.json                  # Turborepo 설정
└── README.md
```

---

## 3. 데이터베이스 스키마

### 3.1 핵심 테이블 정의

아래 스키마를 Prisma 스키마 파일로 구현한다.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// 점포 관련
// ==========================================

model Store {
  id              String   @id @default(uuid())
  businessNumber  String   @unique @map("business_number")
  name            String
  description     String?
  categoryId      String   @map("category_id")
  subCategoryId   String?  @map("sub_category_id")
  
  phone           String?
  email           String?
  
  address         String
  addressDetail   String?  @map("address_detail")
  postalCode      String?  @map("postal_code")
  latitude        Decimal  @db.Decimal(10, 8)
  longitude       Decimal  @db.Decimal(11, 8)
  
  operatingHours  Json     @default("{}") @map("operating_hours")
  seatingCapacity Int?     @map("seating_capacity")
  hasParking      Boolean  @default(false) @map("has_parking")
  hasDelivery     Boolean  @default(false) @map("has_delivery")
  deliveryPlatforms String[] @map("delivery_platforms")
  
  logoUrl         String?  @map("logo_url")
  coverImageUrl   String?  @map("cover_image_url")
  images          String[]
  
  status          StoreStatus @default(ACTIVE)
  isVerified      Boolean  @default(false) @map("is_verified")
  verifiedAt      DateTime? @map("verified_at")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  // Relations
  category        StoreCategory @relation("CategoryStores", fields: [categoryId], references: [id])
  subCategory     StoreCategory? @relation("SubCategoryStores", fields: [subCategoryId], references: [id])
  accounts        StoreAccount[]
  items           Item[]
  coupons         Coupon[]
  redemptions     Redemption[]
  salesPatterns   StoreSalesPattern[]
  
  // 파트너십
  distributorPartnerships Partnership[] @relation("DistributorStore")
  providerPartnerships    Partnership[] @relation("ProviderStore")
  
  // 크로스쿠폰
  crossCoupons    CrossCoupon[]
  issuedTokens    MealToken[]
  
  @@map("store")
}

enum StoreStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  CLOSED
}

model StoreCategory {
  id           String   @id @default(uuid())
  name         String
  nameEn       String?  @map("name_en")
  icon         String?
  parentId     String?  @map("parent_id")
  displayOrder Int      @default(0) @map("display_order")
  isActive     Boolean  @default(true) @map("is_active")
  
  createdAt    DateTime @default(now()) @map("created_at")
  
  // Relations
  parent       StoreCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     StoreCategory[] @relation("CategoryHierarchy")
  stores       Store[] @relation("CategoryStores")
  subStores    Store[] @relation("SubCategoryStores")
  
  @@map("store_category")
}

model StoreAccount {
  id           String   @id @default(uuid())
  storeId      String   @map("store_id")
  
  phone        String   @unique
  passwordHash String   @map("password_hash")
  
  ownerName    String   @map("owner_name")
  email        String?
  
  role         StoreRole @default(OWNER)
  permissions  String[]
  
  isActive     Boolean  @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at")
  
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  // Relations
  store        Store    @relation(fields: [storeId], references: [id])
  
  @@map("store_account")
}

enum StoreRole {
  OWNER
  MANAGER
  STAFF
}

model StoreSalesPattern {
  id           String   @id @default(uuid())
  storeId      String   @map("store_id")
  
  periodType   String   @map("period_type") // hourly, daily, weekly, monthly
  periodStart  DateTime @map("period_start")
  periodEnd    DateTime @map("period_end")
  
  hourlyPattern Json?   @map("hourly_pattern")
  dailyPattern  Json?   @map("daily_pattern")
  vulnerableSlots Json? @map("vulnerable_slots")
  
  calculatedAt DateTime @default(now()) @map("calculated_at")
  
  // Relations
  store        Store    @relation(fields: [storeId], references: [id])
  
  @@unique([storeId, periodType, periodStart])
  @@map("store_sales_pattern")
}

// ==========================================
// 메뉴(아이템) 관련
// ==========================================

model Item {
  id           String   @id @default(uuid())
  storeId      String   @map("store_id")
  
  name         String
  description  String?
  category     String?
  
  price        Int
  cost         Int?
  marginRate   Decimal? @db.Decimal(5, 4) @map("margin_rate")
  
  imageUrl     String?  @map("image_url")
  
  isAvailable  Boolean  @default(true) @map("is_available")
  isPopular    Boolean  @default(false) @map("is_popular")
  displayOrder Int      @default(0) @map("display_order")
  
  options      Json?
  
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")
  
  // Relations
  store        Store    @relation(fields: [storeId], references: [id])
  couponItems  CouponItem[]
  salesPatterns ItemSalesPattern[]
  
  @@map("item")
}

model ItemSalesPattern {
  id           String   @id @default(uuid())
  itemId       String   @map("item_id")
  storeId      String   @map("store_id")
  
  periodStart  DateTime @map("period_start")
  periodEnd    DateTime @map("period_end")
  
  salesShare   Decimal? @db.Decimal(5, 4) @map("sales_share")
  orderShare   Decimal? @db.Decimal(5, 4) @map("order_share")
  
  timePopularity Json?  @map("time_popularity")
  seasonality   Json?
  weatherCorrelation Json? @map("weather_correlation")
  
  calculatedAt DateTime @default(now()) @map("calculated_at")
  
  // Relations
  item         Item     @relation(fields: [itemId], references: [id])
  
  @@unique([itemId, periodStart])
  @@map("item_sales_pattern")
}

// ==========================================
// 쿠폰 관련
// ==========================================

model Coupon {
  id              String   @id @default(uuid())
  storeId         String   @map("store_id")
  
  name            String
  description     String?
  
  discountType    DiscountType @map("discount_type")
  discountValue   Int?     @map("discount_value")
  discountCondition Json?  @map("discount_condition")
  
  targetScope     TargetScope @default(SPECIFIC) @map("target_scope")
  targetCategory  String?  @map("target_category")
  
  validFrom       DateTime @map("valid_from")
  validUntil      DateTime @map("valid_until")
  
  availableDays   Int[]    @map("available_days")
  availableTimeStart String? @map("available_time_start")
  availableTimeEnd   String? @map("available_time_end")
  
  blackoutDates   DateTime[] @map("blackout_dates")
  
  totalQuantity   Int?     @map("total_quantity")
  dailyLimit      Int?     @map("daily_limit")
  perUserLimit    Int      @default(1) @map("per_user_limit")
  
  distributionChannels String[] @map("distribution_channels")
  
  status          CouponStatus @default(DRAFT)
  
  templateId      String?  @map("template_id")
  parentCouponId  String?  @map("parent_coupon_id")
  version         Int      @default(1)
  
  statsIssued     Int      @default(0) @map("stats_issued")
  statsRedeemed   Int      @default(0) @map("stats_redeemed")
  statsRedemptionRate Decimal @default(0) @db.Decimal(5, 4) @map("stats_redemption_rate")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")
  
  // Relations
  store           Store    @relation(fields: [storeId], references: [id])
  template        CouponTemplate? @relation(fields: [templateId], references: [id])
  parentCoupon    Coupon?  @relation("CouponVersions", fields: [parentCouponId], references: [id])
  childCoupons    Coupon[] @relation("CouponVersions")
  
  couponItems     CouponItem[]
  savedCoupons    SavedCoupon[]
  redemptions     Redemption[]
  dailyStats      CouponDailyStats[]
  performance     CouponPerformance[]
  
  @@map("coupon")
}

enum DiscountType {
  FIXED
  PERCENTAGE
  BOGO
  BUNDLE
  FREEBIE
  CONDITIONAL
}

enum TargetScope {
  ALL
  CATEGORY
  SPECIFIC
}

enum CouponStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  PAUSED
  ENDED
}

model CouponItem {
  id        String   @id @default(uuid())
  couponId  String   @map("coupon_id")
  itemId    String   @map("item_id")
  
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relations
  coupon    Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  item      Item     @relation(fields: [itemId], references: [id])
  
  @@unique([couponId, itemId])
  @@map("coupon_item")
}

model CouponTemplate {
  id              String   @id @default(uuid())
  
  name            String
  description     String?
  category        String?
  
  suitableStoreTypes String[] @map("suitable_store_types")
  suitableSituations String[] @map("suitable_situations")
  
  defaultDna      Json     @map("default_dna")
  customizationGuide Json? @map("customization_guide")
  
  totalInstances  Int      @default(0) @map("total_instances")
  avgRoi          Decimal? @db.Decimal(6, 3) @map("avg_roi")
  successRate     Decimal? @db.Decimal(5, 4) @map("success_rate")
  
  performanceByIndustry Json? @map("performance_by_industry")
  performanceByRegion   Json? @map("performance_by_region")
  failurePatterns       Json? @map("failure_patterns")
  
  isActive        Boolean  @default(true) @map("is_active")
  isFeatured      Boolean  @default(false) @map("is_featured")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relations
  coupons         Coupon[]
  
  @@map("coupon_template")
}

model CouponDailyStats {
  id              String   @id @default(uuid())
  couponId        String   @map("coupon_id")
  date            DateTime @db.Date
  
  issuedCount     Int      @default(0) @map("issued_count")
  issuedByChannel Json     @default("{}") @map("issued_by_channel")
  
  redeemedCount   Int      @default(0) @map("redeemed_count")
  redeemedByHour  Json     @default("{}") @map("redeemed_by_hour")
  
  totalDiscountAmount Int  @default(0) @map("total_discount_amount")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relations
  coupon          Coupon   @relation(fields: [couponId], references: [id])
  
  @@unique([couponId, date])
  @@map("coupon_daily_stats")
}

model CouponPerformance {
  id                   String   @id @default(uuid())
  couponId             String   @map("coupon_id")
  
  analysisPeriodStart  DateTime @map("analysis_period_start")
  analysisPeriodEnd    DateTime @map("analysis_period_end")
  
  baselinePeriodStart  DateTime @map("baseline_period_start")
  baselinePeriodEnd    DateTime @map("baseline_period_end")
  baselineSales        Int?     @map("baseline_sales")
  
  actualSales          Int?     @map("actual_sales")
  
  salesLift            Int?     @map("sales_lift")
  salesLiftPercent     Decimal? @db.Decimal(5, 4) @map("sales_lift_percent")
  
  discountCost         Int?     @map("discount_cost")
  netEffect            Int?     @map("net_effect")
  roi                  Decimal? @db.Decimal(6, 3)
  
  spilloverOtherItems  Decimal? @db.Decimal(5, 4) @map("spillover_other_items")
  spilloverOtherSlots  Decimal? @db.Decimal(5, 4) @map("spillover_other_slots")
  
  calculatedAt         DateTime @default(now()) @map("calculated_at")
  
  // Relations
  coupon               Coupon   @relation(fields: [couponId], references: [id])
  
  @@unique([couponId, analysisPeriodStart])
  @@map("coupon_performance")
}

// ==========================================
// 고객 관련
// ==========================================

model Customer {
  id              String   @id @default(uuid())
  
  deviceId        String?  @unique @map("device_id")
  phone           String?  @unique
  
  authProvider    String?  @map("auth_provider")
  authProviderId  String?  @map("auth_provider_id")
  
  nickname        String?
  
  lastLatitude    Decimal? @db.Decimal(10, 8) @map("last_latitude")
  lastLongitude   Decimal? @db.Decimal(11, 8) @map("last_longitude")
  
  statsCouponsSaved    Int @default(0) @map("stats_coupons_saved")
  statsCouponsUsed     Int @default(0) @map("stats_coupons_used")
  statsTotalSavedAmount Int @default(0) @map("stats_total_saved_amount")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  lastActiveAt    DateTime? @map("last_active_at")
  
  // Relations
  savedCoupons    SavedCoupon[]
  redemptions     Redemption[]
  mealTokens      MealToken[]
  favoriteStores  FavoriteStore[]
  
  @@map("customer")
}

model SavedCoupon {
  id              String   @id @default(uuid())
  customerId      String   @map("customer_id")
  couponId        String   @map("coupon_id")
  
  acquiredAt      DateTime @default(now()) @map("acquired_at")
  acquiredChannel String?  @map("acquired_channel")
  
  status          SavedCouponStatus @default(ACTIVE)
  
  usedAt          DateTime? @map("used_at")
  redemptionId    String?  @unique @map("redemption_id")
  
  expiresAt       DateTime @map("expires_at")
  
  createdAt       DateTime @default(now()) @map("created_at")
  
  // Relations
  customer        Customer @relation(fields: [customerId], references: [id])
  coupon          Coupon   @relation(fields: [couponId], references: [id])
  redemption      Redemption? @relation(fields: [redemptionId], references: [id])
  
  @@unique([customerId, couponId])
  @@map("saved_coupon")
}

enum SavedCouponStatus {
  ACTIVE
  USED
  EXPIRED
}

model FavoriteStore {
  id          String   @id @default(uuid())
  customerId  String   @map("customer_id")
  storeId     String   @map("store_id")
  
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  customer    Customer @relation(fields: [customerId], references: [id])
  
  @@unique([customerId, storeId])
  @@map("favorite_store")
}

// ==========================================
// 사용 기록
// ==========================================

model Redemption {
  id              String   @id @default(uuid())
  
  couponId        String   @map("coupon_id")
  savedCouponId   String?  @map("saved_coupon_id")
  customerId      String?  @map("customer_id")
  storeId         String   @map("store_id")
  
  redeemedAt      DateTime @default(now()) @map("redeemed_at")
  
  orderAmount     Int?     @map("order_amount")
  discountAmount  Int      @map("discount_amount")
  finalAmount     Int?     @map("final_amount")
  
  orderItems      Json?    @map("order_items")
  
  createdAt       DateTime @default(now()) @map("created_at")
  
  // Relations
  coupon          Coupon   @relation(fields: [couponId], references: [id])
  customer        Customer? @relation(fields: [customerId], references: [id])
  store           Store    @relation(fields: [storeId], references: [id])
  savedCoupon     SavedCoupon?
  
  @@map("redemption")
}

// ==========================================
// 파트너십 & 크로스쿠폰
// ==========================================

model Partnership {
  id                   String   @id @default(uuid())
  
  distributorStoreId   String   @map("distributor_store_id")
  providerStoreId      String   @map("provider_store_id")
  
  status               PartnershipStatus @default(PENDING)
  
  requestedBy          String?  @map("requested_by")
  requestedAt          DateTime @default(now()) @map("requested_at")
  respondedAt          DateTime? @map("responded_at")
  
  commissionPerRedemption Int   @default(500) @map("commission_per_redemption")
  
  statsTokensIssued    Int      @default(0) @map("stats_tokens_issued")
  statsCouponsSelected Int      @default(0) @map("stats_coupons_selected")
  statsRedemptions     Int      @default(0) @map("stats_redemptions")
  
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")
  terminatedAt         DateTime? @map("terminated_at")
  
  // Relations
  distributorStore     Store    @relation("DistributorStore", fields: [distributorStoreId], references: [id])
  providerStore        Store    @relation("ProviderStore", fields: [providerStoreId], references: [id])
  crossCoupons         CrossCoupon[]
  mealTokens           MealToken[]
  settlements          CrossCouponSettlement[]
  
  @@unique([distributorStoreId, providerStoreId])
  @@map("partnership")
}

enum PartnershipStatus {
  PENDING
  ACTIVE
  PAUSED
  TERMINATED
}

model CrossCoupon {
  id                String   @id @default(uuid())
  partnershipId     String   @map("partnership_id")
  providerStoreId   String   @map("provider_store_id")
  
  name              String
  discountType      DiscountType @map("discount_type")
  discountValue     Int?     @map("discount_value")
  description       String?
  
  targetItems       String[] @map("target_items")
  
  redemptionWindow  String   @default("next_day") @map("redemption_window")
  availableTimeStart String? @map("available_time_start")
  availableTimeEnd   String? @map("available_time_end")
  
  dailyLimit        Int      @default(30) @map("daily_limit")
  
  isActive          Boolean  @default(true) @map("is_active")
  
  statsSelected     Int      @default(0) @map("stats_selected")
  statsRedeemed     Int      @default(0) @map("stats_redeemed")
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // Relations
  partnership       Partnership @relation(fields: [partnershipId], references: [id])
  providerStore     Store    @relation(fields: [providerStoreId], references: [id])
  mealTokens        MealToken[]
  
  @@map("cross_coupon")
}

model MealToken {
  id                   String   @id @default(uuid())
  tokenCode            String   @unique @map("token_code")
  
  distributorStoreId   String   @map("distributor_store_id")
  partnershipId        String?  @map("partnership_id")
  
  issuedAt             DateTime @default(now()) @map("issued_at")
  
  mealType             String?  @map("meal_type")
  dayOfWeek            Int?     @map("day_of_week")
  
  expiresAt            DateTime @map("expires_at")
  
  status               MealTokenStatus @default(ISSUED)
  
  selectedCrossCouponId String? @map("selected_cross_coupon_id")
  selectedAt           DateTime? @map("selected_at")
  redeemedAt           DateTime? @map("redeemed_at")
  
  customerId           String?  @map("customer_id")
  
  createdAt            DateTime @default(now()) @map("created_at")
  
  // Relations
  distributorStore     Store    @relation(fields: [distributorStoreId], references: [id])
  partnership          Partnership? @relation(fields: [partnershipId], references: [id])
  selectedCrossCoupon  CrossCoupon? @relation(fields: [selectedCrossCouponId], references: [id])
  customer             Customer? @relation(fields: [customerId], references: [id])
  
  @@map("meal_token")
}

enum MealTokenStatus {
  ISSUED
  SELECTED
  REDEEMED
  EXPIRED
}

model CrossCouponSettlement {
  id                String   @id @default(uuid())
  partnershipId     String   @map("partnership_id")
  
  periodStart       DateTime @map("period_start")
  periodEnd         DateTime @map("period_end")
  
  totalRedemptions  Int      @map("total_redemptions")
  commissionPerUnit Int      @map("commission_per_unit")
  totalCommission   Int      @map("total_commission")
  
  status            SettlementStatus @default(PENDING)
  
  paidAt            DateTime? @map("paid_at")
  paymentReference  String?  @map("payment_reference")
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // Relations
  partnership       Partnership @relation(fields: [partnershipId], references: [id])
  
  @@unique([partnershipId, periodStart])
  @@map("cross_coupon_settlement")
}

enum SettlementStatus {
  PENDING
  CONFIRMED
  PAID
}

// ==========================================
// 상권 & 피로도 매트릭스
// ==========================================

model CommercialArea {
  id              String   @id @default(uuid())
  
  name            String
  type            String?
  
  centerLatitude  Decimal  @db.Decimal(10, 8) @map("center_latitude")
  centerLongitude Decimal  @db.Decimal(11, 8) @map("center_longitude")
  
  characteristics Json?
  
  statsTotalStores   Int   @default(0) @map("stats_total_stores")
  statsActiveCoupons Int   @default(0) @map("stats_active_coupons")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relations
  fatigueMatrix   CategoryFatigueMatrix[]
  
  @@map("commercial_area")
}

model CategoryFatigueMatrix {
  id                 String   @id @default(uuid())
  commercialAreaId   String?  @map("commercial_area_id")
  
  transitionMatrix   Json     @map("transition_matrix")
  timeModifiers      Json?    @map("time_modifiers")
  recommendedPairings Json?   @map("recommended_pairings")
  
  sampleSize         Int?     @map("sample_size")
  lastCalculatedAt   DateTime? @map("last_calculated_at")
  
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")
  
  // Relations
  commercialArea     CommercialArea? @relation(fields: [commercialAreaId], references: [id])
  
  @@map("category_fatigue_matrix")
}
```

### 3.2 핵심 테이블 요약

| 테이블 | 설명 | 주요 필드 |
|--------|------|----------|
| Store | 점포 정보 | id, businessNumber, name, category, lat/lng |
| StoreAccount | 점포 계정 (사장님) | id, storeId, phone, passwordHash |
| Item | 메뉴/아이템 | id, storeId, name, price, cost |
| Coupon | 쿠폰 | id, storeId, discountType, validFrom, validUntil |
| CouponTemplate | 쿠폰 템플릿 | id, name, defaultDna, avgRoi |
| Customer | 고객 | id, deviceId, phone, authProvider |
| SavedCoupon | 저장된 쿠폰 | id, customerId, couponId, status |
| Redemption | 쿠폰 사용 기록 | id, couponId, customerId, discountAmount |
| Partnership | 파트너십 | id, distributorStoreId, providerStoreId |
| CrossCoupon | 크로스 쿠폰 | id, partnershipId, discountType |
| MealToken | 식사 토큰 | id, tokenCode, distributorStoreId, status |
| CategoryFatigueMatrix | 카테고리 피로도 | transitionMatrix, recommendedPairings |

### 3.3 Enum 정의

| Enum | 값 |
|------|-----|
| StoreStatus | ACTIVE, INACTIVE, SUSPENDED, CLOSED |
| DiscountType | FIXED, PERCENTAGE, BOGO, BUNDLE, FREEBIE, CONDITIONAL |
| CouponStatus | DRAFT, SCHEDULED, ACTIVE, PAUSED, ENDED |
| SavedCouponStatus | ACTIVE, USED, EXPIRED |
| PartnershipStatus | PENDING, ACTIVE, PAUSED, TERMINATED |
| MealTokenStatus | ISSUED, SELECTED, REDEEMED, EXPIRED |

---

## 4. API 명세

### 4.1 API 구조

```
Base URL: https://api.couponday.kr/v1

/api/v1
├── /auth                    # 인증
│   ├── POST /store/register
│   ├── POST /store/login
│   ├── POST /store/refresh
│   ├── POST /customer/anonymous
│   ├── POST /customer/social
│   └── POST /customer/phone/verify
│
├── /store                   # 점포 (사장님)
│   ├── GET /me
│   ├── PATCH /me
│   ├── GET /me/dashboard
│   ├── GET /me/sales-pattern
│   │
│   ├── /items               # 메뉴
│   │   ├── GET /
│   │   ├── POST /
│   │   ├── PATCH /:id
│   │   └── DELETE /:id
│   │
│   ├── /coupons             # 쿠폰
│   │   ├── GET /
│   │   ├── GET /recommendations
│   │   ├── POST /
│   │   ├── GET /:id
│   │   ├── PATCH /:id
│   │   ├── PATCH /:id/status
│   │   ├── GET /:id/qr
│   │   └── GET /:id/performance
│   │
│   ├── /partnerships        # 파트너십
│   │   ├── GET /
│   │   ├── GET /recommendations
│   │   ├── POST /requests
│   │   ├── PATCH /requests/:id
│   │   ├── GET /:id
│   │   └── GET /:id/settlements
│   │
│   └── /tokens              # 토큰 발급
│       └── POST /
│
├── /customer                # 고객
│   ├── GET /me
│   ├── PATCH /me
│   │
│   ├── /coupons             # 쿠폰 조회
│   │   ├── GET /nearby
│   │   ├── GET /map
│   │   ├── GET /:id
│   │   └── POST /:id/save
│   │
│   ├── /me/coupons          # 내 쿠폰함
│   │   ├── GET /
│   │   └── GET /:id/qr
│   │
│   ├── /tokens              # 크로스쿠폰
│   │   ├── GET /:code/available-coupons
│   │   └── POST /:code/select
│   │
│   ├── /me/tokens
│   │   └── GET /
│   │
│   └── /stores              # 가게 조회
│       ├── GET /search
│       └── GET /:id
│
├── /redemptions             # 쿠폰 사용
│   └── POST /               # (점포에서 호출)
│
└── /common                  # 공통
    ├── GET /categories
    ├── GET /commercial-areas
    └── GET /app-config
```

### 4.2 인증 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /auth/store/register | 점포 회원가입 |
| POST | /auth/store/login | 점포 로그인 |
| POST | /auth/store/refresh | 토큰 갱신 |
| POST | /auth/customer/anonymous | 비회원 세션 생성 |
| POST | /auth/customer/social | 소셜 로그인 |

### 4.3 점포 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /store/me | 내 점포 정보 |
| PATCH | /store/me | 점포 정보 수정 |
| GET | /store/me/dashboard | 대시보드 데이터 |
| GET | /store/me/items | 메뉴 목록 |
| POST | /store/me/items | 메뉴 추가 |
| POST | /store/me/coupons | 쿠폰 생성 |
| GET | /store/me/coupons/recommendations | AI 쿠폰 추천 |
| GET | /store/me/coupons/:id/performance | 쿠폰 성과 분석 |
| GET | /store/me/partnerships | 파트너십 목록 |
| GET | /store/me/partnerships/recommendations | AI 파트너 추천 |
| POST | /store/me/partnerships/requests | 파트너십 요청 |
| POST | /store/me/tokens | 토큰 발급 |

### 4.4 고객 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /customer/coupons/nearby | 주변 쿠폰 조회 |
| GET | /customer/coupons/map | 지도용 쿠폰 |
| POST | /customer/coupons/:id/save | 쿠폰 저장 |
| GET | /customer/me/coupons | 내 쿠폰함 |
| GET | /customer/me/coupons/:id/qr | 사용 QR 조회 |
| GET | /customer/tokens/:code/available-coupons | 선택 가능 크로스쿠폰 |
| POST | /customer/tokens/:code/select | 크로스쿠폰 선택 |
| GET | /customer/stores/:id | 가게 상세 |

### 4.5 응답 형식

```json
// 성공 응답
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "COUPON_001",
    "message": "이미 저장한 쿠폰입니다",
    "details": { ... }
  }
}
```

### 4.6 에러 코드

| 코드 | 설명 |
|------|------|
| AUTH_001 | 인증 필요 |
| AUTH_002 | 토큰 만료 |
| AUTH_003 | 유효하지 않은 토큰 |
| COUPON_001 | 이미 저장한 쿠폰 |
| COUPON_002 | 수량 소진 |
| COUPON_003 | 오늘 수량 소진 |
| COUPON_004 | 사용 불가 시간 |
| COUPON_005 | 이미 사용됨 |
| COUPON_006 | 만료됨 |
| CROSS_001 | 이미 선택됨 |
| CROSS_002 | 토큰 만료 |
| PARTNER_001 | 이미 파트너십 존재 |
| PARTNER_002 | 자기 자신 불가 |

---

## 5. 구현 작업 명세

### 5.1 Phase 1: 기반 구축 (2주)

| Task ID | 태스크 | 내용 | 예상 시간 |
|---------|--------|------|----------|
| 1.1 | 프로젝트 초기화 | Turborepo 모노레포, ESLint, Prettier, CI/CD | 2일 |
| 1.2 | 데이터베이스 설정 | PostgreSQL + PostGIS, Prisma 스키마, 마이그레이션 | 3일 |
| 1.3 | API 서버 기본 구조 | Express/Fastify, 미들웨어, Swagger 문서화 | 3일 |
| 1.4 | 인증 모듈 | JWT 발급/검증, 회원가입/로그인, 리프레시 토큰 | 3일 |

### 5.2 Phase 2: 핵심 기능 - 점포 (2주)

| Task ID | 태스크 | 내용 | 예상 시간 |
|---------|--------|------|----------|
| 2.1 | 점포 관리 API | 점포 CRUD, 이미지 업로드 (S3), 대시보드 | 2일 |
| 2.2 | 메뉴 관리 API | 메뉴 CRUD, 카테고리 관리 | 2일 |
| 2.3 | 쿠폰 관리 API | 쿠폰 CRUD, QR 생성, 상태 관리 | 4일 |
| 2.4 | AI 쿠폰 추천 | 매출 패턴 분석, 취약 시간대 감지, 템플릿 매칭 | 3일 |
| 2.5 | 쿠폰 성과 분석 | 기준선 계산, ROI 계산, 일별 통계 | 3일 |

### 5.3 Phase 3: 핵심 기능 - 고객 (2주)

| Task ID | 태스크 | 내용 | 예상 시간 |
|---------|--------|------|----------|
| 3.1 | 쿠폰 조회 API | 주변 쿠폰 (PostGIS), 지도 마커, 필터링 | 3일 |
| 3.2 | 쿠폰 저장 & 사용 | 쿠폰함, QR 표시, 사용 처리 | 3일 |
| 3.3 | 가게 조회 | 검색, 상세, 즐겨찾기 | 2일 |
| 3.4 | 푸시 알림 | FCM 연동, 알림 발송, 알림 관리 | 2일 |

### 5.4 Phase 4: 크로스 쿠폰 시스템 (2주)

| Task ID | 태스크 | 내용 | 예상 시간 |
|---------|--------|------|----------|
| 4.1 | 파트너십 관리 | 파트너 매칭 알고리즘, 요청/수락 | 4일 |
| 4.2 | 크로스 쿠폰 설정 | 크로스 쿠폰 CRUD, 파트너십 연결 | 2일 |
| 4.3 | 식사 토큰 시스템 | 토큰 발급, 코드 생성, 선택/사용 | 4일 |
| 4.4 | 정산 시스템 | 정산 집계 스케줄러, 내역 조회 | 2일 |

### 5.5 Phase 5: 프론트엔드 - 소상공인 앱 (3주)

| Task ID | 태스크 | 내용 | 예상 시간 |
|---------|--------|------|----------|
| 5.1 | RN 프로젝트 설정 | React Native + TypeScript, 네비게이션, 상태 관리 | 2일 |
| 5.2 | 인증 화면 | 스플래시, 로그인, 회원가입 | 3일 |
| 5.3 | 홈 (대시보드) | 매출 요약, 활성 쿠폰, AI 추천 알림 | 3일 |
| 5.4 | 쿠폰 관리 화면 | 쿠폰 목록, 상세, 생성 플로우, QR | 5일 |
| 5.5 | 쿠폰 성과 분석 화면 | 지표, 차트, 인사이트 | 3일 |
| 5.6 | 파트너십 화면 | 파트너 목록, 추천, 요청/수락, 정산 | 4일 |
| 5.7 | 설정 & 기타 | 가게 정보, 메뉴 관리, 알림 설정 | 2일 |

### 5.6 Phase 6: 프론트엔드 - 고객 앱 (3주)

| Task ID | 태스크 | 내용 | 예상 시간 |
|---------|--------|------|----------|
| 6.1 | RN 프로젝트 설정 | React Native, 위치 권한, 지도 연동 | 2일 |
| 6.2 | 홈 화면 | 위치 기반 쿠폰, 카테고리, 검색 | 3일 |
| 6.3 | 지도 화면 | 쿠폰 마커, 클러스터링, 프리뷰 | 4일 |
| 6.4 | 가게 상세 & 쿠폰 받기 | 가게 정보, 쿠폰 목록, 받기 플로우 | 3일 |
| 6.5 | 내 쿠폰함 | 쿠폰 목록, 상세, QR 표시 | 3일 |
| 6.6 | 크로스 쿠폰 | 토큰 스캔, 쿠폰 선택, 오늘의 선택 | 4일 |
| 6.7 | 마이페이지 & 설정 | 프로필, 통계, 즐겨찾기, 알림 | 2일 |

### 5.7 Phase 7: 테스트 & 배포 (2주)

| Task ID | 태스크 | 내용 | 예상 시간 |
|---------|--------|------|----------|
| 7.1 | API 테스트 | 단위 테스트, 통합 테스트, 커버리지 80% | 4일 |
| 7.2 | 프론트엔드 테스트 | 컴포넌트 테스트, E2E 테스트 (Detox) | 3일 |
| 7.3 | 배포 환경 구성 | Kubernetes, Helm, 모니터링, 로깅 | 3일 |
| 7.4 | 앱 스토어 배포 | iOS App Store, Google Play Store 등록 | 3일 |

---

## 6. 화면 설계 명세

### 6.1 소상공인 앱 화면 목록

| 화면 ID | 화면명 | 설명 |
|---------|--------|------|
| S-001 | 스플래시 | 앱 로딩 |
| S-002 | 로그인 | 휴대폰 번호 + 비밀번호 |
| S-003 | 회원가입 | 사업자등록번호 확인 → 정보 입력 |
| S-010 | 홈 (대시보드) | 오늘 매출, 활성 쿠폰, AI 추천 |
| S-020 | 쿠폰 목록 | 운영중/예약/종료 탭 |
| S-021 | 쿠폰 상세 | 쿠폰 정보 + 성과 요약 |
| S-022 | 쿠폰 생성 - 진입 | AI추천/템플릿/직접설계 선택 |
| S-023 | 쿠폰 생성 - AI추천 | 추천 쿠폰 목록 |
| S-024 | 쿠폰 생성 - Step1 | 대상 메뉴 선택 |
| S-025 | 쿠폰 생성 - Step2 | 할인 방식 |
| S-026 | 쿠폰 생성 - Step3 | 시간 조건 |
| S-027 | 쿠폰 생성 - Step4 | 수량/배포 |
| S-028 | 쿠폰 생성 - Step5 | 최종 확인 |
| S-029 | 쿠폰 성과 분석 | 상세 분석 화면 |
| S-030 | 파트너십 목록 | 내 파트너 현황 |
| S-031 | 파트너 찾기 | AI 추천 파트너 |
| S-032 | 파트너 상세 | 파트너 정보 + 성과 |
| S-033 | 파트너 요청 | 요청 보내기/받기 |
| S-040 | 메뉴 관리 | 메뉴 목록 + CRUD |
| S-050 | 설정 | 가게 정보, 알림 등 |

### 6.2 고객 앱 화면 목록

| 화면 ID | 화면명 | 설명 |
|---------|--------|------|
| C-001 | 스플래시 | 앱 로딩 |
| C-002 | 온보딩 | 앱 소개 (첫 실행 시) |
| C-003 | 위치 권한 | 위치 권한 요청 |
| C-010 | 홈 | 주변 쿠폰, 카테고리, 검색 |
| C-020 | 지도 | 쿠폰 마커 지도 |
| C-021 | 지도 - 쿠폰 프리뷰 | 마커 탭 시 바텀시트 |
| C-030 | 가게 상세 | 가게 정보 + 쿠폰 목록 |
| C-031 | 쿠폰 받기 완료 | 저장 완료 애니메이션 |
| C-040 | 내 쿠폰함 | 저장한 쿠폰 목록 |
| C-041 | 쿠폰 사용 (QR) | QR 코드 표시 |
| C-050 | 오늘의 선택 | 크로스 쿠폰 탭 |
| C-051 | 토큰 스캔 | QR 스캔 화면 |
| C-052 | 쿠폰 선택 | 선택 가능한 쿠폰 목록 |
| C-053 | 선택 완료 | 선택 완료 화면 |
| C-060 | 마이페이지 | 프로필, 통계, 설정 |

---

## 7. 비즈니스 로직 상세

### 7.1 쿠폰 사용 가능 여부 판단

```typescript
// src/modules/coupon/services/coupon-availability.service.ts

interface AvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  nextAvailable?: Date;
}

function checkCouponAvailability(
  coupon: Coupon,
  now: Date = new Date()
): AvailabilityResult {
  // 1. 쿠폰 상태 확인
  if (coupon.status !== 'ACTIVE') {
    return { isAvailable: false, reason: 'COUPON_NOT_ACTIVE' };
  }
  
  // 2. 유효 기간 확인
  if (now < coupon.validFrom) {
    return { 
      isAvailable: false, 
      reason: 'NOT_STARTED_YET',
      nextAvailable: coupon.validFrom 
    };
  }
  if (now > coupon.validUntil) {
    return { isAvailable: false, reason: 'EXPIRED' };
  }
  
  // 3. 요일 확인
  const dayOfWeek = now.getDay(); // 0=일, 1=월, ...
  if (coupon.availableDays.length > 0 && 
      !coupon.availableDays.includes(dayOfWeek)) {
    return { 
      isAvailable: false, 
      reason: 'NOT_AVAILABLE_TODAY',
      nextAvailable: getNextAvailableDate(coupon, now)
    };
  }
  
  // 4. 시간 확인
  if (coupon.availableTimeStart && coupon.availableTimeEnd) {
    const currentTime = format(now, 'HH:mm');
    if (currentTime < coupon.availableTimeStart || 
        currentTime > coupon.availableTimeEnd) {
      return { 
        isAvailable: false, 
        reason: 'NOT_AVAILABLE_NOW',
        nextAvailable: getNextAvailableTime(coupon, now)
      };
    }
  }
  
  // 5. 블랙아웃 날짜 확인
  const today = format(now, 'yyyy-MM-dd');
  if (coupon.blackoutDates.some(d => format(d, 'yyyy-MM-dd') === today)) {
    return { isAvailable: false, reason: 'BLACKOUT_DATE' };
  }
  
  // 6. 수량 확인
  if (coupon.totalQuantity !== null && 
      coupon.statsRedeemed >= coupon.totalQuantity) {
    return { isAvailable: false, reason: 'SOLD_OUT' };
  }
  
  // 7. 일일 한도 확인
  if (coupon.dailyLimit !== null) {
    const todayRedeemed = await getTodayRedemptionCount(coupon.id);
    if (todayRedeemed >= coupon.dailyLimit) {
      return { 
        isAvailable: false, 
        reason: 'DAILY_LIMIT_REACHED',
        nextAvailable: getNextDayStart(now)
      };
    }
  }
  
  return { isAvailable: true };
}
```

### 7.2 쿠폰 성과 ROI 계산

```typescript
// src/modules/coupon/services/coupon-performance.service.ts

interface PerformanceResult {
  baselineSales: number;
  actualSales: number;
  salesLift: number;
  salesLiftPercent: number;
  discountCost: number;
  netEffect: number;
  roi: number;
}

async function calculateCouponPerformance(
  couponId: string,
  analysisStart: Date,
  analysisEnd: Date
): Promise<PerformanceResult> {
  const coupon = await getCouponWithStore(couponId);
  
  // 1. 기준선 기간 결정 (전월 동일 기간)
  const baselineStart = subMonths(analysisStart, 1);
  const baselineEnd = subMonths(analysisEnd, 1);
  
  // 2. 기준선 매출 조회 (타겟 시간대만)
  const baselineSales = await getSalesForPeriod(
    coupon.storeId,
    baselineStart,
    baselineEnd,
    {
      days: coupon.availableDays,
      timeStart: coupon.availableTimeStart,
      timeEnd: coupon.availableTimeEnd
    }
  );
  
  // 3. 실제 매출 조회 (동일 조건)
  const actualSales = await getSalesForPeriod(
    coupon.storeId,
    analysisStart,
    analysisEnd,
    {
      days: coupon.availableDays,
      timeStart: coupon.availableTimeStart,
      timeEnd: coupon.availableTimeEnd
    }
  );
  
  // 4. 할인 비용 계산
  const redemptions = await getRedemptionsForPeriod(couponId, analysisStart, analysisEnd);
  const discountCost = redemptions.reduce((sum, r) => sum + r.discountAmount, 0);
  
  // 5. 효과 계산
  const salesLift = actualSales - baselineSales;
  const salesLiftPercent = baselineSales > 0 ? salesLift / baselineSales : 0;
  const netEffect = salesLift - discountCost;
  const roi = discountCost > 0 ? netEffect / discountCost : 0;
  
  return {
    baselineSales,
    actualSales,
    salesLift,
    salesLiftPercent,
    discountCost,
    netEffect,
    roi
  };
}
```

**ROI 계산 공식:**

```
기준선(Baseline) = 전월 동기간 동일 조건 매출
매출 증분 = 실제 매출 - 기준선 매출
할인 비용 = Σ(사용건 × 할인금액)
순효과 = 매출 증분 - 할인 비용
ROI = 순효과 / 할인 비용
```

### 7.3 파트너 매칭 알고리즘

```typescript
// src/modules/partnership/services/partner-matching.service.ts

interface PartnerRecommendation {
  store: Store;
  matchScore: number;
  reasons: string[];
  expectedPerformance: {
    monthlyTokenInflow: number;
    monthlyCouponSelections: number;
    expectedRoi: number;
  };
  categoryTransition: {
    from: string;
    to: string;
    transitionRate: number;
  };
}

async function getPartnerRecommendations(
  storeId: string,
  role: 'provider' | 'distributor',
  limit: number = 10
): Promise<PartnerRecommendation[]> {
  const myStore = await getStoreWithCategory(storeId);
  const fatigueMatrix = await getCategoryFatigueMatrix(myStore.commercialAreaId);
  
  // 1. 후보 점포 조회 (반경 500m, 다른 카테고리)
  const candidates = await getNearbyStores(
    myStore.latitude,
    myStore.longitude,
    500, // meters
    {
      excludeCategory: myStore.categoryId,
      excludeStoreId: storeId,
      excludeExistingPartners: true
    }
  );
  
  // 2. 각 후보에 대해 점수 계산
  const scored = candidates.map(candidate => {
    const score = calculateMatchScore(myStore, candidate, fatigueMatrix, role);
    return { store: candidate, ...score };
  });
  
  // 3. 점수 순 정렬 후 반환
  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
```

**매칭 점수 기준 (총 100점):**

| 기준 | 배점 | 설명 |
|------|------|------|
| 카테고리 전환율 | 40점 | 피로도 매트릭스 기반 전환 확률 |
| 거리 | 20점 | 100-300m 최적, 너무 가깝거나 멀면 감점 |
| 가격대 유사성 | 20점 | 객단가 ±30% 이내 시 만점 |
| 피크 시간 일치 | 20점 | 동일 피크 시간대면 만점 |

### 7.4 토큰 코드 생성

```typescript
// src/modules/cross-coupon/services/token.service.ts

import { customAlphabet } from 'nanoid';

// 읽기 쉬운 문자만 사용 (혼동되는 문자 제외: 0, O, I, l 등)
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = customAlphabet(alphabet, 8);

async function issueMealToken(
  distributorStoreId: string,
  options?: { mealType?: string; customerId?: string }
): Promise<MealToken> {
  // 고유 코드 생성 (충돌 시 재시도)
  let tokenCode: string;
  let attempts = 0;
  
  do {
    tokenCode = generateCode();
    const exists = await prisma.mealToken.findUnique({
      where: { tokenCode }
    });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);
  
  if (attempts >= 10) {
    throw new Error('Failed to generate unique token code');
  }
  
  // 만료 시간: 다음날 23:59:59
  const now = new Date();
  const expiresAt = endOfDay(addDays(now, 1));
  
  // 토큰 생성
  const token = await prisma.mealToken.create({
    data: {
      tokenCode,
      distributorStoreId,
      issuedAt: now,
      expiresAt,
      mealType: options?.mealType || getMealTypeFromTime(now),
      dayOfWeek: now.getDay(),
      status: 'ISSUED',
      customerId: options?.customerId
    }
  });
  
  return token;
}
```

**토큰 코드 규칙:**
- 알파벳: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (혼동 문자 제외)
- 코드 길이: 8자리 (예: `ABC123XY`)
- 만료: 발급 다음날 23:59:59

---

## 8. 환경 설정

### 8.1 환경 변수

```bash
# .env.example

# ===========================================
# Database
# ===========================================
DATABASE_URL="postgresql://couponday:couponday_dev_password@localhost:5432/coupon_day?schema=public"
REDIS_URL="redis://localhost:6379"

# ===========================================
# Authentication
# ===========================================
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="30d"

# ===========================================
# AWS
# ===========================================
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="coupon-day-images"

# ===========================================
# Firebase (Push Notifications)
# ===========================================
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"

# ===========================================
# External APIs
# ===========================================
NTS_API_KEY="국세청 API 키"
WEATHER_API_KEY="기상청 API 키"

# ===========================================
# App Settings
# ===========================================
NODE_ENV="development"
PORT=3000
API_VERSION="v1"
CORS_ORIGINS="http://localhost:3000,http://localhost:19006"
```

### 8.2 Docker Compose (개발환경)

```yaml
# docker/docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: coupon-day-postgres
    environment:
      POSTGRES_USER: couponday
      POSTGRES_PASSWORD: couponday_dev_password
      POSTGRES_DB: coupon_day
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U couponday -d coupon_day"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: coupon-day-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    container_name: coupon-day-api
    environment:
      DATABASE_URL: postgresql://couponday:couponday_dev_password@postgres:5432/coupon_day
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ../apps/api-server:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## 9. 코딩 규칙

### 9.1 네이밍 컨벤션

| 항목 | 규칙 | 예시 |
|------|------|------|
| 파일명 | kebab-case | `coupon-performance.service.ts` |
| 클래스 | PascalCase | `CouponPerformanceService` |
| 함수/변수 | camelCase | `calculateRoi`, `discountAmount` |
| 상수 | UPPER_SNAKE_CASE | `MAX_DAILY_LIMIT` |
| 타입/인터페이스 | PascalCase | `CouponCreateInput` |
| Enum | PascalCase | `CouponStatus` |
| API 경로 | kebab-case | `/api/v1/store/me/coupons` |

### 9.2 폴더 구조 규칙

```
src/modules/{module-name}/
├── {module-name}.controller.ts    # 라우터 핸들러
├── {module-name}.service.ts       # 비즈니스 로직
├── {module-name}.repository.ts    # DB 쿼리
├── {module-name}.validator.ts     # 입력 검증 (Zod)
├── {module-name}.types.ts         # 타입 정의
└── dto/
    ├── create-{entity}.dto.ts
    └── update-{entity}.dto.ts
```

### 9.3 API 응답 형식

```typescript
// 성공 응답
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "COUPON_001",
    "message": "이미 저장한 쿠폰입니다",
    "details": { ... }
  }
}
```

---

## 10. 테스트 전략

### 10.1 테스트 범위

| 테스트 유형 | 대상 | 목표 |
|-------------|------|------|
| Unit Test | Services, Validators, Utils | 커버리지 80% |
| Integration Test | API Endpoints, DB Operations | 주요 플로우 |
| E2E Test | Critical User Flows | 핵심 시나리오 |

### 10.2 E2E 테스트 시나리오

- 쿠폰 생성 → 저장 → 사용 플로우
- 파트너십 요청 → 수락 플로우
- 토큰 발급 → 쿠폰 선택 → 사용 플로우

### 10.3 테스트 명령어

```bash
# 전체 테스트
npm run test

# 특정 모듈 테스트
npm run test -- --testPathPattern=coupon

# 커버리지 리포트
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

---

## 11. 마일스톤

| Phase | 기간 | 산출물 |
|-------|------|--------|
| Phase 1 | Week 1-2 | 프로젝트 기반, DB, 인증 |
| Phase 2 | Week 3-4 | 점포 API (쿠폰, AI추천) |
| Phase 3 | Week 5-6 | 고객 API (조회, 저장, 사용) |
| Phase 4 | Week 7-8 | 크로스쿠폰 시스템 |
| Phase 5 | Week 9-11 | 소상공인 앱 |
| Phase 6 | Week 12-14 | 고객 앱 |
| Phase 7 | Week 15-16 | 테스트, 배포 |

**총 예상 기간: 16주 (약 4개월)**

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-12-17 | - | 초안 작성 |
| 1.0.1 | 2024-12-31 | - | 프로젝트명 통일 (동네쿠폰 → 쿠폰데이) |

---

## 참고 문서

- [API 상세 명세](/docs/api/README.md)
- [데이터베이스 ERD](/docs/database/erd.md)
- [화면 와이어프레임](/docs/wireframes/)
- [디자인 시스템](/docs/design-system/)
