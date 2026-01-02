# PRD 미구현 항목 개발계획서

> 작성일: 2026-01-02
> 최종 수정: 2026-01-02
> 대상: CouponDay API Server v1.1

---

## 개요

PRD 대비 미구현된 4개 기능에 대한 단계별 개발계획입니다.

| # | 기능 | PRD 요구사항 | 현재 상태 | 영향도 | 예상 복잡도 |
|---|------|-------------|----------|--------|------------|
| 1 | 고객 쿠폰 QR | `/customer/me/coupons/:id/qr` | ✅ 완료 | 높음 | 중 |
| 2 | 토큰 목록 조회 | `/customer/me/tokens` | ✅ 완료 | 중 | 낮음 |
| 3 | 푸시 알림 | Firebase Cloud Messaging | ✅ 완료 | 높음 | 높음 |
| 4 | S3 이미지 업로드 | AWS S3 저장 | ✅ 완료 | 중 | 중 |

### 구현 완료 요약 (2026-01-02)

모든 4개 기능이 성공적으로 구현되었습니다.

**생성된 파일:**
- `src/common/services/qr.service.ts` - QR 코드 생성/검증 서비스
- `src/common/services/fcm.service.ts` - Firebase Cloud Messaging 서비스
- `src/common/services/s3.service.ts` - AWS S3 이미지 업로드 서비스
- `src/common/plugins/multipart.plugin.ts` - 파일 업로드 플러그인
- `src/modules/upload/upload.routes.ts` - 이미지 업로드 라우트
- `src/modules/notification/notification.service.ts` - 알림 서비스
- `src/modules/notification/notification.routes.ts` - 알림 라우트

**수정된 파일:**
- `src/modules/customer/customer.routes.ts` - QR 엔드포인트 추가
- `src/modules/redemption/redemption.routes.ts` - QR 스캔 API 추가
- `src/modules/cross-coupon/cross-coupon.routes.ts` - 토큰 목록 API 추가
- `src/modules/cross-coupon/meal-token.service.ts` - 토큰 조회 메서드 추가
- `prisma/schema.prisma` - CustomerDevice, StoreDevice 모델 추가
- `src/app.ts` - 새 라우트 등록

---

## 1. 고객 쿠폰 QR 코드 API

### 1.1 요구사항 분석

**PRD 명세:**
- 고객이 저장한 쿠폰의 QR 코드 조회
- 점포 POS에서 스캔하여 쿠폰 사용 처리
- QR에는 savedCouponId + customerId + 만료시간 포함

**현재 구현:**
- 점포용 쿠폰 QR만 존재 (`/store/me/coupons/:id/qr`)
- 고객앱에서 쿠폰 QR 표시 불가

### 1.2 구현 단계

#### Step 1: QR 유틸리티 서비스 생성
```
파일: src/common/services/qr.service.ts
```

**작업 내용:**
- QR 코드 생성 로직 (qrcode 패키지 활용)
- QR 페이로드 암호화/서명 (JWT 또는 HMAC)
- Base64 이미지 또는 SVG 반환
- 만료 시간 검증 로직

**QR 페이로드 구조:**
```typescript
interface CustomerCouponQRPayload {
  type: 'CUSTOMER_COUPON';
  savedCouponId: string;
  customerId: string;
  couponId: string;
  storeId: string;
  expiresAt: number; // Unix timestamp
  issuedAt: number;
}
```

#### Step 2: Customer Routes에 QR 엔드포인트 추가
```
파일: src/modules/customer/customer.routes.ts
```

**API 명세:**
```
GET /api/v1/customer/me/coupons/:id/qr
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "qrData": "eyJhbGc...", // 서명된 페이로드
    "expiresAt": "2026-01-02T12:00:00Z",
    "coupon": {
      "id": "...",
      "name": "아메리카노 1000원 할인",
      "store": { "name": "카페모카" }
    }
  }
}
```

**구현 로직:**
1. savedCoupon 존재 여부 확인 (customerId + couponId)
2. 상태 검증 (ACTIVE 상태만 허용)
3. 유효기간 검증 (expiresAt > now)
4. QR 페이로드 생성 및 서명
5. QR 이미지 생성 (PNG base64)
6. 응답 반환

#### Step 3: 점포 QR 스캔 검증 엔드포인트
```
파일: src/modules/redemption/redemption.routes.ts
```

**API 명세:**
```
POST /api/v1/store/me/coupons/scan
Authorization: Bearer {token}
Body: { "qrData": "eyJhbGc..." }

Response:
{
  "success": true,
  "data": {
    "valid": true,
    "savedCoupon": { ... },
    "customer": { ... },
    "coupon": { ... }
  }
}
```

#### Step 4: 의존성 설치
```bash
pnpm add qrcode @types/qrcode
```

### 1.3 테스트 계획

- [ ] QR 생성 단위 테스트
- [ ] QR 서명 검증 테스트
- [ ] 만료된 쿠폰 QR 거부 테스트
- [ ] 사용된 쿠폰 QR 거부 테스트
- [ ] 통합 테스트: QR 생성 → 스캔 → 사용 처리

---

## 2. 고객 토큰 목록 조회 API

### 2.1 요구사항 분석

**PRD 명세:**
- 고객이 받은 MealToken 목록 조회
- 상태별 필터링 (ISSUED, SELECTED, REDEEMED, EXPIRED)
- 발급 점포 및 선택한 크로스쿠폰 정보 포함

**현재 구현:**
- 토큰 코드로 개별 조회만 가능 (`/customer/tokens/:code`)
- 목록 조회 API 없음

### 2.2 구현 단계

#### Step 1: Customer Routes에 토큰 목록 엔드포인트 추가
```
파일: src/modules/customer/customer.routes.ts
```

**API 명세:**
```
GET /api/v1/customer/me/tokens
Authorization: Bearer {token}
Query: ?status=ISSUED&limit=20&offset=0

Response:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "tokenCode": "TKN-XXXX-XXXX",
      "status": "ISSUED",
      "issuedAt": "2026-01-01T12:00:00Z",
      "expiresAt": "2026-01-02T23:59:59Z",
      "distributorStore": {
        "id": "...",
        "name": "김밥천국 강남점"
      },
      "selectedCrossCoupon": null
    }
  ],
  "meta": { "total": 10, "page": 1, "limit": 20 }
}
```

**구현 로직:**
1. customerId로 MealToken 목록 조회
2. 상태 필터링 적용
3. 페이지네이션 적용
4. 관계 데이터 포함 (distributorStore, selectedCrossCoupon)
5. 만료 토큰 자동 상태 업데이트 (선택적)

#### Step 2: 토큰 상세 조회 개선
```
GET /api/v1/customer/me/tokens/:id
```

기존 tokenCode 기반 조회를 ID 기반으로도 지원

### 2.3 테스트 계획

- [ ] 토큰 목록 조회 테스트
- [ ] 상태 필터링 테스트
- [ ] 페이지네이션 테스트
- [ ] 빈 목록 응답 테스트

---

## 3. 푸시 알림 시스템 (Firebase Cloud Messaging)

### 3.1 요구사항 분석

**PRD 명세:**
- FCM을 통한 푸시 알림
- 알림 유형:
  - 새 쿠폰 발급 알림
  - 쿠폰 만료 임박 알림
  - 파트너십 요청/승인 알림
  - 토큰 발급 알림
- 고객/점주 양방향 지원

**현재 구현:**
- 완전 미구현
- FCM 환경변수만 준비됨 (env.ts)

### 3.2 구현 단계

#### Step 1: FCM 서비스 초기화
```
파일: src/common/services/fcm.service.ts
```

**작업 내용:**
- firebase-admin SDK 초기화
- 서비스 계정 인증 설정
- 싱글톤 패턴 적용

```typescript
import * as admin from 'firebase-admin';

class FCMService {
  private app: admin.app.App | null = null;

  async initialize(): Promise<void> {
    if (!env.FIREBASE_PROJECT_ID) return;

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }

  async sendToDevice(token: string, notification: Notification): Promise<string>;
  async sendToTopic(topic: string, notification: Notification): Promise<string>;
  async sendMulticast(tokens: string[], notification: Notification): Promise<BatchResponse>;
}
```

#### Step 2: 알림 타입 정의
```
파일: src/common/types/notification.types.ts
```

```typescript
enum NotificationType {
  // 고객용
  COUPON_SAVED = 'COUPON_SAVED',
  COUPON_EXPIRING = 'COUPON_EXPIRING',
  TOKEN_RECEIVED = 'TOKEN_RECEIVED',
  TOKEN_EXPIRING = 'TOKEN_EXPIRING',

  // 점주용
  PARTNERSHIP_REQUEST = 'PARTNERSHIP_REQUEST',
  PARTNERSHIP_ACCEPTED = 'PARTNERSHIP_ACCEPTED',
  COUPON_REDEEMED = 'COUPON_REDEEMED',
  DAILY_SUMMARY = 'DAILY_SUMMARY',
}

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}
```

#### Step 3: 디바이스 토큰 저장 스키마 확장
```
파일: prisma/schema.prisma
```

```prisma
model CustomerDevice {
  id          String   @id @default(uuid())
  customerId  String   @map("customer_id")

  fcmToken    String   @unique @map("fcm_token")
  platform    String   // ios, android, web
  deviceModel String?  @map("device_model")

  isActive    Boolean  @default(true) @map("is_active")
  lastUsedAt  DateTime @default(now()) @map("last_used_at")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  customer    Customer @relation(fields: [customerId], references: [id])

  @@map("customer_device")
}

model StoreDevice {
  id          String   @id @default(uuid())
  accountId   String   @map("account_id")

  fcmToken    String   @unique @map("fcm_token")
  platform    String

  isActive    Boolean  @default(true)
  lastUsedAt  DateTime @default(now()) @map("last_used_at")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  account     StoreAccount @relation(fields: [accountId], references: [id])

  @@map("store_device")
}
```

#### Step 4: 디바이스 등록 API
```
파일: src/modules/notification/notification.routes.ts
```

**API 명세:**
```
POST /api/v1/customer/me/devices
Body: { "fcmToken": "...", "platform": "ios" }

POST /api/v1/store/me/devices
Body: { "fcmToken": "...", "platform": "android" }

DELETE /api/v1/customer/me/devices/:token
DELETE /api/v1/store/me/devices/:token
```

#### Step 5: 알림 발송 서비스
```
파일: src/modules/notification/notification.service.ts
```

**주요 메서드:**
```typescript
class NotificationService {
  // 고객 알림
  async notifyCustomer(customerId: string, payload: NotificationPayload): Promise<void>;
  async notifyCustomerCouponExpiring(customerId: string, couponId: string): Promise<void>;
  async notifyCustomerTokenReceived(customerId: string, tokenId: string): Promise<void>;

  // 점주 알림
  async notifyStore(storeId: string, payload: NotificationPayload): Promise<void>;
  async notifyPartnershipRequest(targetStoreId: string, fromStoreId: string): Promise<void>;
  async notifyCouponRedeemed(storeId: string, redemptionId: string): Promise<void>;
}
```

#### Step 6: 이벤트 트리거 통합

**쿠폰 저장 시:**
```typescript
// customer.routes.ts - POST /coupons/:id/save
await notificationService.notifyCustomer(customerId, {
  type: NotificationType.COUPON_SAVED,
  title: '쿠폰이 저장되었습니다',
  body: `${coupon.name} 쿠폰이 쿠폰함에 저장되었습니다.`,
  data: { couponId: coupon.id },
});
```

**파트너십 요청 시:**
```typescript
// partnership.routes.ts - POST /partnerships
await notificationService.notifyPartnershipRequest(targetStoreId, storeId);
```

#### Step 7: 스케줄러 (만료 임박 알림)
```
파일: src/jobs/notification-scheduler.ts
```

```typescript
// 매일 오전 9시 실행
// - 오늘 만료되는 쿠폰 보유 고객에게 알림
// - 내일 만료되는 토큰 보유 고객에게 알림
```

#### Step 8: 의존성 설치
```bash
pnpm add firebase-admin
```

### 3.3 테스트 계획

- [ ] FCM 초기화 테스트 (환경변수 없을 때 graceful skip)
- [ ] 디바이스 등록/해제 테스트
- [ ] 단일 발송 테스트 (mock)
- [ ] 다중 발송 테스트 (mock)
- [ ] 알림 페이로드 생성 테스트

---

## 4. S3 이미지 업로드 시스템

### 4.1 요구사항 분석

**PRD 명세:**
- AWS S3에 이미지 저장
- 대상: 점포 로고, 커버 이미지, 메뉴 이미지
- 이미지 리사이징 및 최적화
- CDN 연동 (CloudFront)

**현재 구현:**
- URL 문자열만 저장
- 실제 업로드 기능 없음
- AWS 환경변수 준비됨

### 4.2 구현 단계

#### Step 1: S3 클라이언트 서비스
```
파일: src/common/services/s3.service.ts
```

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class S3Service {
  private client: S3Client;
  private bucket: string;
  private cdnDomain?: string;

  constructor() {
    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = env.AWS_S3_BUCKET!;
    this.cdnDomain = env.AWS_CLOUDFRONT_DOMAIN;
  }

  async uploadImage(file: Buffer, options: UploadOptions): Promise<UploadResult>;
  async deleteImage(key: string): Promise<void>;
  async getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
  getPublicUrl(key: string): string;
}

interface UploadOptions {
  folder: 'stores' | 'items' | 'coupons';
  filename?: string;
  contentType: string;
  resize?: { width: number; height: number };
}

interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
}
```

#### Step 2: 이미지 처리 유틸리티
```
파일: src/common/utils/image.util.ts
```

```typescript
import sharp from 'sharp';

export async function processImage(
  buffer: Buffer,
  options: ImageProcessOptions
): Promise<Buffer> {
  let processor = sharp(buffer);

  // 리사이징
  if (options.resize) {
    processor = processor.resize(options.resize.width, options.resize.height, {
      fit: 'cover',
      position: 'center',
    });
  }

  // 포맷 변환 (WebP 권장)
  processor = processor.webp({ quality: options.quality || 80 });

  return processor.toBuffer();
}

interface ImageProcessOptions {
  resize?: { width: number; height: number };
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}
```

#### Step 3: Multipart 파일 업로드 플러그인
```
파일: src/common/plugins/multipart.plugin.ts
```

```typescript
import multipart from '@fastify/multipart';

export default fp(async (app: FastifyInstance) => {
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 5, // 최대 5개 파일
    },
  });
});
```

#### Step 4: 업로드 라우트 추가
```
파일: src/modules/upload/upload.routes.ts
```

**API 명세:**
```
POST /api/v1/store/me/images
Authorization: Bearer {token}
Content-Type: multipart/form-data
Body: file (binary), folder (string)

Response:
{
  "success": true,
  "data": {
    "key": "stores/abc123/logo-1704153600.webp",
    "url": "https://s3.ap-northeast-2.amazonaws.com/couponday/...",
    "cdnUrl": "https://cdn.couponday.kr/stores/abc123/logo-1704153600.webp"
  }
}
```

**이미지 타입별 설정:**
```typescript
const IMAGE_CONFIGS = {
  logo: { maxWidth: 200, maxHeight: 200, folder: 'stores' },
  cover: { maxWidth: 1200, maxHeight: 400, folder: 'stores' },
  item: { maxWidth: 800, maxHeight: 800, folder: 'items' },
  coupon: { maxWidth: 600, maxHeight: 400, folder: 'coupons' },
};
```

#### Step 5: Store 라우트에 이미지 업로드 통합
```
파일: src/modules/store/store.routes.ts
```

```typescript
// 로고 업로드
app.post('/me/logo', {
  preHandler: storeAuthGuard,
}, async (request, reply) => {
  const file = await request.file();
  const result = await s3Service.uploadImage(file.toBuffer(), {
    folder: 'stores',
    filename: `${storeId}/logo`,
    resize: { width: 200, height: 200 },
  });

  await prisma.store.update({
    where: { id: storeId },
    data: { logoUrl: result.cdnUrl || result.url },
  });

  return sendSuccess(reply, result);
});

// 커버 이미지 업로드
app.post('/me/cover', { ... });
```

#### Step 6: Item 라우트에 이미지 업로드 통합
```
파일: src/modules/item/item.routes.ts (또는 menu.routes.ts)
```

```typescript
app.post('/me/items/:id/image', {
  preHandler: storeAuthGuard,
}, async (request, reply) => {
  const file = await request.file();
  const result = await s3Service.uploadImage(file.toBuffer(), {
    folder: 'items',
    filename: `${storeId}/${itemId}`,
    resize: { width: 800, height: 800 },
  });

  await prisma.item.update({
    where: { id: itemId },
    data: { imageUrl: result.cdnUrl || result.url },
  });

  return sendSuccess(reply, result);
});
```

#### Step 7: Presigned URL 방식 (선택적)
```
GET /api/v1/store/me/images/presigned
Query: ?filename=logo.png&folder=stores

Response:
{
  "uploadUrl": "https://s3.../presigned...",
  "key": "stores/abc123/logo-xxx.webp",
  "expiresIn": 300
}
```

클라이언트에서 직접 S3로 업로드 (서버 부하 감소)

#### Step 8: 의존성 설치
```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp @fastify/multipart
pnpm add -D @types/sharp
```

### 4.3 테스트 계획

- [ ] S3 업로드 단위 테스트 (LocalStack 또는 mock)
- [ ] 이미지 리사이징 테스트
- [ ] 파일 크기 제한 테스트
- [ ] 지원 포맷 검증 테스트
- [ ] Presigned URL 생성 테스트

---

## 구현 우선순위 및 순서

### Phase 1: 기본 기능 (필수)
1. **고객 토큰 목록 조회** - 복잡도 낮음, 영향도 중
2. **고객 쿠폰 QR 코드** - 복잡도 중, 영향도 높음

### Phase 2: 인프라 연동 (중요)
3. **S3 이미지 업로드** - 복잡도 중, 외부 서비스 연동
4. **푸시 알림 시스템** - 복잡도 높음, 전체 시스템 영향

---

## 환경변수 추가 필요

```env
# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=couponday-images
AWS_CLOUDFRONT_DOMAIN=cdn.couponday.kr

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## 의존성 요약

```json
{
  "dependencies": {
    "qrcode": "^1.5.3",
    "firebase-admin": "^12.0.0",
    "@aws-sdk/client-s3": "^3.500.0",
    "@aws-sdk/s3-request-presigner": "^3.500.0",
    "sharp": "^0.33.0",
    "@fastify/multipart": "^8.0.0"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5",
    "@types/sharp": "^0.32.0"
  }
}
```

---

## ACID 원칙 준수 가이드라인

### 개요

데이터 무결성 보장을 위해 다음 패턴들을 적용하여 ACID 원칙 위반을 수정했습니다.

### 적용된 수정 사항

| 우선순위 | 파일 | 함수 | 문제 | 해결 방법 |
|---------|------|------|------|----------|
| P1 | `meal-token.service.ts` | `verifyAndUseToken()` | 다중 UPDATE 미보호 | `$transaction` 적용 |
| P1 | `meal-token.service.ts` | `selectCoupon()` | Race Condition | 트랜잭션 + 낙관적 잠금 |
| P1 | `settlement.service.ts` | `getOrCreateSettlement()` | Check-then-Act | 트랜잭션으로 원자화 |
| P2 | `partnership.service.ts` | `respondToPartnership()` | 상태 검증 분리 | 트랜잭션 + 상태 재검증 |

### 코드 패턴

#### 1. Interactive Transaction (다중 쿼리 원자화)

```typescript
// meal-token.service.ts:327-345
await prisma.$transaction(async (tx) => {
  await tx.mealToken.update({
    where: { id: token.id },
    data: { status: 'REDEEMED', redeemedAt: new Date() },
  });

  await tx.crossCoupon.update({
    where: { id: crossCoupon.id },
    data: { statsRedeemed: { increment: 1 } },
  });
});
```

#### 2. 낙관적 잠금 (Race Condition 방지)

```typescript
// meal-token.service.ts:216-266
const updatedToken = await prisma.$transaction(async (tx) => {
  // 트랜잭션 내에서 상태 재확인
  const currentToken = await tx.mealToken.findUnique({
    where: { id: token.id },
    select: { status: true },
  });

  if (!currentToken || currentToken.status !== 'ISSUED') {
    throw createError(ErrorCodes.VALIDATION_001, {
      message: '토큰이 이미 사용되었거나 만료되었습니다'
    });
  }

  // 일일 한도 검증도 트랜잭션 내에서 수행
  if (crossCoupon.dailyLimit) {
    const todayUsageCount = await tx.mealToken.count({ ... });
    if (todayUsageCount >= crossCoupon.dailyLimit) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '일일 발급 한도가 초과되었습니다' });
    }
  }

  return tx.mealToken.update({ ... });
});
```

#### 3. Check-then-Act 보호

```typescript
// settlement.service.ts:143-183
return prisma.$transaction(async (tx) => {
  // 존재 여부 확인과 생성을 동일 트랜잭션에서
  let settlement = await tx.crossCouponSettlement.findFirst({ ... });

  if (settlement) return settlement;

  // 계산 및 생성
  const calculated = await this.calculateSettlement(...);
  settlement = await tx.crossCouponSettlement.create({ ... });

  return settlement;
});
```

### 개발 가이드라인

#### 트랜잭션이 필요한 경우

1. **다중 테이블 업데이트**: 2개 이상 테이블을 수정할 때
2. **통계 업데이트 포함**: 상태 변경 + 카운터 증가 등
3. **Check-then-Act 패턴**: 조회 후 조건부 생성/수정
4. **금융/결제 관련**: 포인트, 정산, 할인 계산

#### 트랜잭션 사용 패턴

```typescript
// 권장 패턴
await prisma.$transaction(async (tx) => {
  // 모든 쿼리는 tx 사용
  const record = await tx.model.findUnique({ ... });

  // 상태 검증
  if (record.status !== 'EXPECTED') {
    throw new Error('Invalid state');
  }

  // 업데이트
  await tx.model.update({ ... });
  await tx.relatedModel.update({ ... });
});
```

### 성능 고려사항

- 트랜잭션 내 외부 API 호출 최소화
- 긴 트랜잭션은 잠금 경합 유발 가능
- 읽기 전용 쿼리는 트랜잭션 밖에서 수행 권장

---

*이 문서는 PRD v1.1 기준으로 작성되었습니다.*
*ACID 가이드라인은 2026-01-02에 추가되었습니다.*
