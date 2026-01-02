# 프론트엔드 앱 구현 계획서

> 작성일: 2026-01-02
> 대상: customer-web, admin-web

---

## 개요

현재 배포된 store-web과 api-server를 기반으로, 미구현된 customer-web과 admin-web의 단계별 개발계획입니다.

### 앱별 구현 현황

| 앱 | 페이지 수 | 상태 | 비고 |
|---|---------|------|------|
| **store-web** | 14개 | ✅ 배포됨 | 참조 구현체 |
| **api-server** | - | ✅ 배포됨 | 모든 API 준비됨 |
| **customer-web** | 6개 | ⚠️ 기본 구조만 | 페이지 내용 필요 |
| **admin-web** | 3개 | ⚠️ 기본 구조만 | 페이지 내용 필요 |

---

## Phase 1: Customer-Web 핵심 기능 (Sprint 1)

### 1.1 쿠폰 상세 및 저장 플로우

**대상 페이지:**
```
/stores/[id]/page.tsx          - 가게 상세
/coupons/[id]/page.tsx         - 쿠폰 상세 + 저장
```

**구현 내용:**
- 가게 정보 표시 (이름, 주소, 카테고리, 설명)
- 가게의 활성 쿠폰 목록
- 쿠폰 상세 정보 (할인 타입, 유효기간, 사용 조건)
- 쿠폰 저장 버튼 + 저장 완료 애니메이션
- 이미 저장한 쿠폰 상태 표시

**연동 API:**
- `GET /customer/stores/:id` (public-store.routes.ts)
- `GET /customer/coupons/:id`
- `POST /customer/coupons/:id/save`

**예상 작업량:** 4-6시간

---

### 1.2 쿠폰 사용 QR 화면

**대상 페이지:**
```
/wallet/[id]/page.tsx          - 저장된 쿠폰 상세 + QR
```

**구현 내용:**
- 저장된 쿠폰 상세 정보
- QR 코드 표시 (qrcode 패키지)
- 유효기간/사용 조건 안내
- 점포 위치 정보 (지도 링크)
- 만료 임박 경고

**연동 API:**
- `GET /customer/me/coupons/:id/qr` (신규 구현됨)

**QR 데이터 처리:**
```typescript
// qrData를 받아서 QR 이미지 생성
const response = await api.get(`/customer/me/coupons/${id}/qr`);
// response.data = { qrCode: "base64...", qrData: "signed...", expiresAt: "..." }
```

**예상 작업량:** 3-4시간

---

### 1.3 지도 화면 개선

**대상 페이지:**
```
/(tabs)/map/page.tsx           - 지도 쿠폰 검색
```

**구현 내용:**
- Kakao/Naver 지도 연동
- 쿠폰 마커 표시
- 마커 클릭 시 바텀시트 (쿠폰 프리뷰)
- 현재 위치 버튼
- 지역 필터링

**연동 API:**
- `GET /customer/coupons/map?lat=...&lng=...&zoom=...`

**지도 SDK 선택:**
```
추천: react-kakao-maps-sdk (Kakao Maps)
대안: @react-google-maps/api (Google Maps)
```

**예상 작업량:** 6-8시간 (지도 SDK 연동 포함)

---

## Phase 2: Customer-Web 크로스쿠폰 (Sprint 2)

### 2.1 토큰 목록 화면

**대상 페이지:**
```
/tokens/page.tsx               - 내 토큰 목록 (오늘의 선택)
```

**구현 내용:**
- 받은 토큰 목록 (상태별: ISSUED, SELECTED, REDEEMED)
- 토큰 만료시간 표시
- 발급 점포 정보
- 선택한 크로스쿠폰 정보 (선택 완료 시)

**연동 API:**
- `GET /customer/me/tokens` (신규 구현됨)
- `GET /customer/me/tokens/:id` (신규 구현됨)

**예상 작업량:** 3-4시간

---

### 2.2 토큰 상세 및 쿠폰 선택

**대상 페이지:**
```
/tokens/[code]/page.tsx        - 토큰 상세 + 쿠폰 선택
```

**구현 내용:**
- 토큰 정보 (발급 점포, 만료시간)
- 선택 가능한 크로스쿠폰 목록
- 쿠폰 선택 버튼
- 선택 완료 상태 표시
- 이미 사용된 토큰 안내

**연동 API:**
- `GET /customer/tokens/:code/available-coupons`
- `POST /customer/tokens/:code/select`

**예상 작업량:** 4-5시간

---

### 2.3 토큰 QR 스캔

**대상 페이지:**
```
/tokens/scan/page.tsx          - QR 스캔 화면
```

**구현 내용:**
- 카메라 QR 스캔 (html5-qrcode 또는 @yudiel/react-qr-scanner)
- 스캔 결과 → 토큰 상세 페이지로 이동
- 권한 요청 처리
- 스캔 실패 안내

**의존성:**
```bash
pnpm add @yudiel/react-qr-scanner
```

**예상 작업량:** 3-4시간

---

## Phase 3: Customer-Web 마이페이지 (Sprint 3)

### 3.1 마이페이지 개선

**대상 페이지:**
```
/(tabs)/profile/page.tsx       - 마이페이지
```

**구현 내용:**
- 프로필 정보 (닉네임, 가입일)
- 통계 (저장 쿠폰, 사용 쿠폰, 절약 금액)
- 즐겨찾기 가게 목록
- 알림 설정
- 앱 정보/문의

**연동 API:**
- `GET /customer/me`
- `GET /customer/me/favorites`
- `PATCH /customer/me` (닉네임 수정)

**예상 작업량:** 4-5시간

---

## Phase 4: Admin-Web 구현 (Sprint 4-5)

### 4.1 대시보드

**대상 페이지:**
```
/page.tsx                      - 관리자 대시보드
```

**구현 내용:**
- 전체 통계 카드 (점포 수, 쿠폰 수, 사용 건수)
- 일별/주별 차트 (Chart.js 또는 Recharts)
- 최근 활동 목록
- 알림 배너

**연동 API:**
- `GET /admin/dashboard` (신규 필요)
- `GET /admin/stats` (신규 필요)

**예상 작업량:** 6-8시간

---

### 4.2 점포 관리 개선

**대상 페이지:**
```
/stores/page.tsx               - 점포 목록 + 필터
/stores/[id]/page.tsx          - 점포 상세 + 관리
```

**구현 내용:**
- 점포 목록 테이블 (DataTable)
- 상태 필터 (ACTIVE, INACTIVE, SUSPENDED)
- 카테고리 필터
- 검색 기능
- 점포 상세 (정보, 쿠폰, 메뉴, 파트너십)
- 상태 변경 기능

**연동 API:**
- `GET /admin/stores` (신규 필요)
- `GET /admin/stores/:id` (신규 필요)
- `PATCH /admin/stores/:id` (신규 필요)

**예상 작업량:** 8-10시간

---

### 4.3 추가 관리 페이지

**대상 페이지:**
```
/coupons/page.tsx              - 전체 쿠폰 관리
/partnerships/page.tsx         - 파트너십 현황
/customers/page.tsx            - 고객 관리
/categories/page.tsx           - 카테고리 관리
/settings/page.tsx             - 시스템 설정
```

**각 페이지 공통 구성:**
- 데이터 테이블 (페이지네이션, 정렬)
- 필터/검색
- 상세 보기/수정 모달
- 통계 요약

**예상 작업량:** 각 4-6시간 × 5 = 20-30시간

---

## 의존성 추가 필요

### Customer-Web

```bash
pnpm add qrcode @types/qrcode           # QR 코드 생성
pnpm add @yudiel/react-qr-scanner       # QR 스캔
pnpm add react-kakao-maps-sdk           # 카카오 지도
pnpm add framer-motion                  # 애니메이션 (선택)
```

### Admin-Web

```bash
pnpm add recharts                       # 차트
pnpm add @tanstack/react-table          # 데이터 테이블
pnpm add react-hook-form zod            # 폼 관리
pnpm add sonner                         # 토스트 알림
```

---

## API 서버 추가 구현 필요 (Admin)

현재 admin 전용 API가 없습니다. 다음 API 추가 필요:

```typescript
// src/modules/admin/admin.routes.ts

// 대시보드
GET  /admin/dashboard          // 전체 통계
GET  /admin/stats              // 상세 통계 (기간별)

// 점포 관리
GET  /admin/stores             // 점포 목록 (필터, 페이지네이션)
GET  /admin/stores/:id         // 점포 상세
PATCH /admin/stores/:id        // 점포 정보 수정
PATCH /admin/stores/:id/status // 점포 상태 변경

// 쿠폰 관리
GET  /admin/coupons            // 전체 쿠폰 목록
GET  /admin/coupons/:id        // 쿠폰 상세

// 파트너십 관리
GET  /admin/partnerships       // 파트너십 목록
GET  /admin/partnerships/:id   // 파트너십 상세

// 고객 관리
GET  /admin/customers          // 고객 목록
GET  /admin/customers/:id      // 고객 상세

// 카테고리 관리
GET  /admin/categories         // 카테고리 목록
POST /admin/categories         // 카테고리 생성
PATCH /admin/categories/:id    // 카테고리 수정
```

---

## 구현 우선순위 및 일정

### 권장 구현 순서

| 순위 | 항목 | 앱 | 예상 시간 | 누적 |
|-----|-----|---|---------|-----|
| 1 | 쿠폰 상세/저장 | customer | 4-6h | 6h |
| 2 | 쿠폰 QR 사용 | customer | 3-4h | 10h |
| 3 | 지도 화면 | customer | 6-8h | 18h |
| 4 | 토큰 목록 | customer | 3-4h | 22h |
| 5 | 토큰 상세/선택 | customer | 4-5h | 27h |
| 6 | QR 스캔 | customer | 3-4h | 31h |
| 7 | 마이페이지 | customer | 4-5h | 36h |
| 8 | Admin API | api-server | 8-10h | 46h |
| 9 | Admin 대시보드 | admin | 6-8h | 54h |
| 10 | Admin 점포관리 | admin | 8-10h | 64h |
| 11 | Admin 추가 페이지 | admin | 20-30h | 94h |

**총 예상 시간: 80-100시간 (2-3주)**

---

## 파일 구조 계획

### Customer-Web 추가 파일

```
apps/customer-web/src/
├── app/
│   ├── stores/
│   │   └── [id]/
│   │       └── page.tsx        # 가게 상세
│   ├── coupons/
│   │   └── [id]/
│   │       └── page.tsx        # 쿠폰 상세
│   ├── wallet/
│   │   └── [id]/
│   │       └── page.tsx        # 저장된 쿠폰 상세 + QR
│   ├── tokens/
│   │   ├── page.tsx            # 토큰 목록
│   │   ├── scan/
│   │   │   └── page.tsx        # QR 스캔
│   │   └── [code]/
│   │       └── page.tsx        # 토큰 상세 + 쿠폰 선택
│   └── search/
│       └── page.tsx            # 검색 결과
├── components/
│   ├── coupon/
│   │   ├── CouponCard.tsx
│   │   ├── CouponDetail.tsx
│   │   └── CouponQR.tsx
│   ├── store/
│   │   ├── StoreCard.tsx
│   │   └── StoreDetail.tsx
│   ├── token/
│   │   ├── TokenCard.tsx
│   │   └── CrossCouponSelector.tsx
│   └── map/
│       ├── MapView.tsx
│       └── CouponMarker.tsx
└── lib/
    └── api.ts                  # API 함수 추가
```

### Admin-Web 추가 파일

```
apps/admin-web/src/
├── app/
│   ├── page.tsx                # 대시보드
│   ├── stores/
│   │   ├── page.tsx            # 점포 목록
│   │   └── [id]/
│   │       └── page.tsx        # 점포 상세
│   ├── coupons/
│   │   └── page.tsx            # 쿠폰 목록
│   ├── partnerships/
│   │   └── page.tsx            # 파트너십 목록
│   ├── customers/
│   │   └── page.tsx            # 고객 목록
│   ├── categories/
│   │   └── page.tsx            # 카테고리 관리
│   └── settings/
│       └── page.tsx            # 시스템 설정
├── components/
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── Chart.tsx
│   │   └── ActivityFeed.tsx
│   ├── data-table/
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   └── Filters.tsx
│   └── modals/
│       ├── StoreDetailModal.tsx
│       └── ConfirmModal.tsx
└── lib/
    └── admin-api.ts            # Admin API 함수
```

---

## 다음 단계

1. **즉시 시작 가능**: Customer-web 쿠폰 상세/저장 (Phase 1.1)
2. **병렬 작업**: Admin API 설계 및 구현

진행하시겠습니까?

---

*이 문서는 2026-01-02에 작성되었습니다.*
