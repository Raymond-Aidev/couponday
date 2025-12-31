import { vi } from 'vitest';

// Test data factories
export const createMockStore = (overrides = {}) => ({
  id: 'store_test_123',
  name: '테스트 가게',
  description: '테스트용 가게입니다',
  address: '서울시 강남구 테스트로 123',
  phone: '02-1234-5678',
  categoryId: 'cat_food',
  category: { id: 'cat_food', name: '음식점', icon: '🍽️' },
  latitude: 37.5665,
  longitude: 126.978,
  imageUrl: null,
  isActive: true,
  operatingHours: {
    mon: { open: '09:00', close: '22:00' },
    tue: { open: '09:00', close: '22:00' },
    wed: { open: '09:00', close: '22:00' },
    thu: { open: '09:00', close: '22:00' },
    fri: { open: '09:00', close: '22:00' },
    sat: { open: '10:00', close: '21:00' },
    sun: { open: '10:00', close: '21:00' },
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockStoreOwner = (overrides = {}) => ({
  id: 'owner_test_123',
  email: 'test@example.com',
  passwordHash: '$2a$10$test.hashed.password',
  name: '홍길동',
  phone: '010-1234-5678',
  businessNumber: '1234567890',
  storeId: 'store_test_123',
  store: createMockStore(),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockCustomer = (overrides = {}) => ({
  id: 'customer_test_123',
  email: 'customer@example.com',
  nickname: '테스트유저',
  phone: '010-9876-5432',
  isAnonymous: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockCoupon = (overrides = {}) => ({
  id: 'coupon_test_123',
  storeId: 'store_test_123',
  store: createMockStore(),
  name: '점심특가 2000원 할인',
  description: '점심 시간 한정 할인',
  type: 'DISCOUNT_AMOUNT',
  discountValue: 2000,
  freeItemName: null,
  minOrderAmount: 10000,
  maxRedemptions: 100,
  currentRedemptions: 25,
  validFrom: new Date('2024-01-01'),
  validUntil: new Date('2024-12-31'),
  availableTimeStart: '11:00',
  availableTimeEnd: '14:00',
  availableDays: [1, 2, 3, 4, 5],
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockPartnership = (overrides = {}) => ({
  id: 'partnership_test_123',
  distributorStoreId: 'store_dist_123',
  providerStoreId: 'store_prov_123',
  distributorStore: createMockStore({ id: 'store_dist_123', name: '배포 가게' }),
  providerStore: createMockStore({ id: 'store_prov_123', name: '제공 가게', categoryId: 'cat_cafe' }),
  status: 'ACTIVE',
  commissionPerRedemption: 500,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockCrossCoupon = (overrides = {}) => ({
  id: 'crosscoupon_test_123',
  partnershipId: 'partnership_test_123',
  providerStoreId: 'store_prov_123',
  name: '커피 1000원 할인',
  description: '식사 후 커피 할인',
  discountType: 'FIXED',
  discountValue: 1000,
  dailyLimit: 50,
  redemptionWindow: 'next_day',
  availableTimeStart: '09:00',
  availableTimeEnd: '18:00',
  isActive: true,
  statsIssued: 100,
  statsRedeemed: 45,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockMealToken = (overrides = {}) => ({
  id: 'token_test_123',
  tokenCode: 'ABCD1234',
  partnershipId: 'partnership_test_123',
  distributorStoreId: 'store_dist_123',
  customerId: null,
  status: 'ISSUED',
  selectedCrossCouponId: null,
  selectedAt: null,
  redeemedAt: null,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock request/response helpers
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

export const createMockReply = () => {
  const reply: any = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  };
  return reply;
};

// JWT helpers
export const createMockJwtPayload = (overrides = {}) => ({
  sub: 'store_test_123',
  type: 'store',
  storeId: 'store_test_123',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});
