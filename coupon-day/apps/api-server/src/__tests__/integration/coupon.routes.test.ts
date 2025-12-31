import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../database/prisma.js';

// Mock prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    redemption: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    couponDailyStats: {
      findMany: vi.fn(),
    },
    couponPerformance: {
      upsert: vi.fn(),
    },
  },
}));

// Mock env
vi.mock('../../config/env.js', () => ({
  env: {
    PORT: 3001,
    HOST: 'localhost',
    NODE_ENV: 'test',
    API_VERSION: 'v1',
    JWT_SECRET: 'test-secret-key-at-least-32-chars',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
    DATABASE_URL: 'postgres://test',
    CORS_ORIGINS: '*',
  },
  isDev: false,
}));

describe('Coupon Routes Integration', () => {
  let app: FastifyInstance;
  const mockPrisma = prisma as any;

  const createMockCoupon = (overrides = {}) => ({
    id: 'coupon_test_123',
    storeId: 'store_test_123',
    store: { id: 'store_test_123', name: '테스트 가게' },
    name: '점심특가 2000원 할인',
    description: '점심 시간 한정 할인',
    type: 'DISCOUNT_AMOUNT',
    discountType: 'FIXED',
    discountValue: 2000,
    minOrderAmount: 10000,
    totalQuantity: 100,
    dailyLimit: 50,
    perUserLimit: 3,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    availableTimeStart: '11:00',
    availableTimeEnd: '14:00',
    availableDays: [1, 2, 3, 4, 5],
    blackoutDates: [],
    status: 'ACTIVE',
    qrCodeUrl: null,
    statsIssued: 100,
    statsRedeemed: 25,
    statsViewCount: 500,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.redemption.count.mockResolvedValue(0);
  });

  describe('GET /api/v1/coupons/:id/availability', () => {
    it('should return availability for active coupon', async () => {
      const coupon = createMockCoupon();
      mockPrisma.coupon.findUnique.mockResolvedValue(coupon);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/coupons/coupon_test_123/availability',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('isAvailable');
    });

    it('should return 404 for non-existent coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/coupons/non_existent_id/availability',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('COUPON_007');
    });

    it('should return unavailable for paused coupon', async () => {
      const coupon = createMockCoupon({ status: 'PAUSED' });
      mockPrisma.coupon.findUnique.mockResolvedValue(coupon);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/coupons/coupon_test_123/availability',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.isAvailable).toBe(false);
      expect(body.data.reasonCode).toBe('COUPON_NOT_ACTIVE');
    });

    it('should return unavailable for expired coupon', async () => {
      const coupon = createMockCoupon({
        validFrom: new Date('2023-01-01'),
        validUntil: new Date('2023-12-31'),
      });
      mockPrisma.coupon.findUnique.mockResolvedValue(coupon);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/coupons/coupon_test_123/availability',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.isAvailable).toBe(false);
      expect(body.data.reasonCode).toBe('EXPIRED');
    });
  });

  describe('GET /api/v1/store/me/coupons/:id/performance', () => {
    const generateAuthToken = (storeId: string) => {
      return app.jwt.sign({
        sub: storeId,
        type: 'store',
        storeId: storeId,
      });
    };

    it('should return performance data for store owner', async () => {
      const token = generateAuthToken('store_test_123');
      const coupon = createMockCoupon();

      mockPrisma.coupon.findFirst.mockResolvedValue(coupon);
      mockPrisma.coupon.findUnique.mockResolvedValue(coupon);
      mockPrisma.redemption.findMany.mockResolvedValue([
        { discountAmount: 2000, orderAmount: 15000 },
        { discountAmount: 2000, orderAmount: 20000 },
      ]);
      mockPrisma.redemption.aggregate.mockResolvedValue({
        _sum: { orderAmount: 50000 },
      });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue([]);
      mockPrisma.couponPerformance.upsert.mockResolvedValue({});

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/coupon_test_123/performance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('metrics');
      expect(body.data).toHaveProperty('stats');
      expect(body.data).toHaveProperty('insights');
    });

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/coupon_test_123/performance',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when coupon not found for store', async () => {
      const token = generateAuthToken('store_test_123');
      mockPrisma.coupon.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/non_existent_id/performance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when trying to access another store coupon', async () => {
      const token = generateAuthToken('store_different');
      mockPrisma.coupon.findFirst.mockResolvedValue(null); // Returns null because storeId doesn't match

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/coupon_test_123/performance',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should accept date range query parameters', async () => {
      const token = generateAuthToken('store_test_123');
      const coupon = createMockCoupon();

      mockPrisma.coupon.findFirst.mockResolvedValue(coupon);
      mockPrisma.coupon.findUnique.mockResolvedValue(coupon);
      mockPrisma.redemption.findMany.mockResolvedValue([]);
      mockPrisma.redemption.aggregate.mockResolvedValue({ _sum: { orderAmount: 0 } });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue([]);
      mockPrisma.couponPerformance.upsert.mockResolvedValue({});

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/coupon_test_123/performance?startDate=2024-06-01&endDate=2024-06-30',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.analysisPeriod.start).toContain('2024-06-01');
      expect(body.data.analysisPeriod.end).toContain('2024-06-30');
    });
  });

  describe('GET /api/v1/store/me/coupons/:id/qr', () => {
    const generateAuthToken = (storeId: string) => {
      return app.jwt.sign({
        sub: storeId,
        type: 'store',
        storeId: storeId,
      });
    };

    it('should return QR code data for store owner', async () => {
      const token = generateAuthToken('store_test_123');
      const coupon = createMockCoupon();

      mockPrisma.coupon.findFirst.mockResolvedValue(coupon);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/coupon_test_123/qr',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('qrData');
      expect(body.data).toHaveProperty('qrUrl');
      expect(body.data.qrUrl).toContain('coupon_test_123');
    });

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/coupon_test_123/qr',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent coupon', async () => {
      const token = generateAuthToken('store_test_123');
      mockPrisma.coupon.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store/me/coupons/non_existent_id/qr',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
