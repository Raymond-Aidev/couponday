import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCouponPerformance, generateInsights, PerformanceResult } from '../../modules/coupon/services/coupon-performance.service.js';
import { prisma } from '../../database/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
    },
    redemption: {
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

describe('CouponPerformanceService', () => {
  const mockPrisma = prisma as any;

  const createMockCoupon = (overrides = {}) => ({
    id: 'coupon_test_123',
    storeId: 'store_test_123',
    store: { id: 'store_test_123', name: '테스트 가게' },
    name: '점심특가 2000원 할인',
    type: 'DISCOUNT_AMOUNT',
    discountValue: 2000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    availableDays: [1, 2, 3, 4, 5],
    availableTimeStart: '11:00',
    availableTimeEnd: '14:00',
    statsIssued: 100,
    statsRedeemed: 45,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  });

  const createMockRedemption = (overrides = {}) => ({
    id: 'redemption_123',
    couponId: 'coupon_test_123',
    customerId: 'customer_123',
    storeId: 'store_test_123',
    discountAmount: 2000,
    orderAmount: 15000,
    redeemedAt: new Date('2024-06-15T12:00:00'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.couponPerformance.upsert.mockResolvedValue({});
  });

  describe('calculateCouponPerformance', () => {
    it('should throw error when coupon not found', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(calculateCouponPerformance('invalid_id')).rejects.toThrow('Coupon not found');
    });

    it('should calculate performance metrics correctly', async () => {
      const mockCoupon = createMockCoupon();
      const mockRedemptions = [
        createMockRedemption({ discountAmount: 2000, orderAmount: 15000 }),
        createMockRedemption({ discountAmount: 2000, orderAmount: 20000 }),
        createMockRedemption({ discountAmount: 2000, orderAmount: 12000 }),
      ];

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.redemption.findMany.mockResolvedValue(mockRedemptions);
      mockPrisma.redemption.aggregate.mockResolvedValue({
        _sum: { orderAmount: 50000 },
      });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue([
        { date: new Date('2024-06-14'), redeemedCount: 10, totalDiscountAmount: 20000 },
        { date: new Date('2024-06-15'), redeemedCount: 15, totalDiscountAmount: 30000 },
      ]);

      const result = await calculateCouponPerformance('coupon_test_123');

      expect(result.couponId).toBe('coupon_test_123');
      expect(result.analysisPeriod.start).toBeDefined();
      expect(result.analysisPeriod.end).toBeDefined();
      expect(result.baselinePeriod.start).toBeDefined();
      expect(result.baselinePeriod.end).toBeDefined();
      expect(result.stats.totalIssued).toBe(100);
      expect(result.stats.totalRedeemed).toBe(45);
      expect(result.stats.redemptionRate).toBeDefined();
    });

    it('should calculate redemption rate correctly', async () => {
      const mockCoupon = createMockCoupon({
        statsIssued: 200,
        statsRedeemed: 100,
      });

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.redemption.findMany.mockResolvedValue([]);
      mockPrisma.redemption.aggregate.mockResolvedValue({ _sum: { orderAmount: 0 } });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue([]);

      const result = await calculateCouponPerformance('coupon_test_123');

      expect(result.stats.redemptionRate).toBe(50); // 100/200 * 100 = 50%
    });

    it('should handle zero issued coupons', async () => {
      const mockCoupon = createMockCoupon({
        statsIssued: 0,
        statsRedeemed: 0,
      });

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.redemption.findMany.mockResolvedValue([]);
      mockPrisma.redemption.aggregate.mockResolvedValue({ _sum: { orderAmount: 0 } });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue([]);

      const result = await calculateCouponPerformance('coupon_test_123');

      expect(result.stats.redemptionRate).toBe(0);
    });

    it('should use custom analysis period when provided', async () => {
      const mockCoupon = createMockCoupon();
      const analysisStart = new Date('2024-06-01');
      const analysisEnd = new Date('2024-06-30');

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.redemption.findMany.mockResolvedValue([]);
      mockPrisma.redemption.aggregate.mockResolvedValue({ _sum: { orderAmount: 0 } });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue([]);

      const result = await calculateCouponPerformance('coupon_test_123', analysisStart, analysisEnd);

      expect(result.analysisPeriod.start).toEqual(analysisStart);
      expect(result.analysisPeriod.end).toEqual(analysisEnd);
    });

    it('should calculate daily breakdown correctly', async () => {
      const mockCoupon = createMockCoupon();
      const mockDailyStats = [
        { date: new Date('2024-06-14'), redeemedCount: 10, totalDiscountAmount: 20000 },
        { date: new Date('2024-06-15'), redeemedCount: 15, totalDiscountAmount: 30000 },
        { date: new Date('2024-06-16'), redeemedCount: 20, totalDiscountAmount: 40000 },
      ];

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.redemption.findMany.mockResolvedValue([]);
      mockPrisma.redemption.aggregate.mockResolvedValue({ _sum: { orderAmount: 0 } });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue(mockDailyStats);

      const result = await calculateCouponPerformance('coupon_test_123');

      expect(result.dailyBreakdown).toHaveLength(3);
      expect(result.dailyBreakdown[0]).toEqual({
        date: '2024-06-14',
        redeemed: 10,
        discountAmount: 20000,
      });
    });

    it('should save performance record to database', async () => {
      const mockCoupon = createMockCoupon();

      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.redemption.findMany.mockResolvedValue([]);
      mockPrisma.redemption.aggregate.mockResolvedValue({ _sum: { orderAmount: 0 } });
      mockPrisma.couponDailyStats.findMany.mockResolvedValue([]);

      await calculateCouponPerformance('coupon_test_123');

      expect(mockPrisma.couponPerformance.upsert).toHaveBeenCalledOnce();
      expect(mockPrisma.couponPerformance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          create: expect.objectContaining({
            couponId: 'coupon_test_123',
          }),
          update: expect.any(Object),
        })
      );
    });
  });

  describe('generateInsights', () => {
    const createMockPerformanceResult = (overrides: Partial<PerformanceResult> = {}): PerformanceResult => ({
      couponId: 'coupon_test_123',
      analysisPeriod: {
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
      },
      baselinePeriod: {
        start: new Date('2024-05-01'),
        end: new Date('2024-05-31'),
      },
      metrics: {
        baselineSales: 100000,
        actualSales: 150000,
        salesLift: 50000,
        salesLiftPercent: 50,
        discountCost: 20000,
        netEffect: 30000,
        roi: 1.5,
      },
      stats: {
        totalIssued: 100,
        totalRedeemed: 60,
        redemptionRate: 60,
      },
      dailyBreakdown: [],
      ...overrides,
    });

    it('should generate positive ROI insight when ROI > 1', () => {
      const performance = createMockPerformanceResult({
        metrics: {
          baselineSales: 100000,
          actualSales: 150000,
          salesLift: 50000,
          salesLiftPercent: 50,
          discountCost: 20000,
          netEffect: 30000,
          roi: 1.5,
        },
      });

      const insights = generateInsights(performance);

      expect(insights).toContain('투자 대비 150%의 수익을 얻었습니다. 훌륭한 성과입니다!');
    });

    it('should generate moderate ROI insight when 0 < ROI <= 1', () => {
      const performance = createMockPerformanceResult({
        metrics: {
          baselineSales: 100000,
          actualSales: 120000,
          salesLift: 20000,
          salesLiftPercent: 20,
          discountCost: 25000,
          netEffect: -5000,
          roi: 0.5,
        },
      });

      const insights = generateInsights(performance);

      expect(insights).toContain('투자 대비 50%의 수익을 얻었습니다.');
    });

    it('should generate neutral insight when ROI = 0', () => {
      const performance = createMockPerformanceResult({
        metrics: {
          baselineSales: 100000,
          actualSales: 120000,
          salesLift: 20000,
          salesLiftPercent: 20,
          discountCost: 20000,
          netEffect: 0,
          roi: 0,
        },
      });

      const insights = generateInsights(performance);

      expect(insights).toContain('할인 비용과 매출 증분이 비슷합니다.');
    });

    it('should generate negative insight when ROI < 0', () => {
      const performance = createMockPerformanceResult({
        metrics: {
          baselineSales: 100000,
          actualSales: 110000,
          salesLift: 10000,
          salesLiftPercent: 10,
          discountCost: 30000,
          netEffect: -20000,
          roi: -0.5,
        },
      });

      const insights = generateInsights(performance);

      expect(insights).toContain('할인 비용이 매출 증분보다 큽니다. 쿠폰 조건을 조정해보세요.');
    });

    it('should generate high redemption rate insight when rate > 50%', () => {
      const performance = createMockPerformanceResult({
        stats: {
          totalIssued: 100,
          totalRedeemed: 60,
          redemptionRate: 60,
        },
      });

      const insights = generateInsights(performance);

      expect(insights.some(i => i.includes('60%의 높은 사용률'))).toBe(true);
    });

    it('should generate low redemption rate insight when rate < 10%', () => {
      const performance = createMockPerformanceResult({
        stats: {
          totalIssued: 100,
          totalRedeemed: 5,
          redemptionRate: 5,
        },
      });

      const insights = generateInsights(performance);

      expect(insights.some(i => i.includes('5%로 낮습니다'))).toBe(true);
    });

    it('should generate sales lift insight when lift > 20%', () => {
      const performance = createMockPerformanceResult({
        metrics: {
          baselineSales: 100000,
          actualSales: 150000,
          salesLift: 50000,
          salesLiftPercent: 50,
          discountCost: 20000,
          netEffect: 30000,
          roi: 1.5,
        },
      });

      const insights = generateInsights(performance);

      expect(insights.some(i => i.includes('50% 증가했습니다'))).toBe(true);
    });

    it('should return multiple insights when applicable', () => {
      const performance = createMockPerformanceResult({
        metrics: {
          baselineSales: 100000,
          actualSales: 200000,
          salesLift: 100000,
          salesLiftPercent: 100,
          discountCost: 30000,
          netEffect: 70000,
          roi: 2.3,
        },
        stats: {
          totalIssued: 100,
          totalRedeemed: 80,
          redemptionRate: 80,
        },
      });

      const insights = generateInsights(performance);

      expect(insights.length).toBeGreaterThan(1);
    });
  });
});
