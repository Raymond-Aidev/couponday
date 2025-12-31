import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettlementService } from '../../modules/cross-coupon/settlement.service.js';
import { prisma } from '../../database/prisma.js';

// Mock prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    partnership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    mealToken: {
      findMany: vi.fn(),
    },
    crossCouponSettlement: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock errors
vi.mock('../../common/utils/errors.js', () => ({
  createError: vi.fn((code, options) => {
    const error = new Error(options?.message || code);
    (error as any).code = code;
    return error;
  }),
  ErrorCodes: {
    VALIDATION_001: 'VALIDATION_001',
  },
}));

describe('SettlementService', () => {
  let service: SettlementService;
  const mockPrisma = prisma as any;

  const createMockPartnership = (overrides = {}) => ({
    id: 'partnership_123',
    distributorStoreId: 'store_dist_123',
    providerStoreId: 'store_prov_123',
    distributorStore: { id: 'store_dist_123', name: '배포 가게' },
    providerStore: { id: 'store_prov_123', name: '제공 가게' },
    status: 'ACTIVE',
    commissionPerRedemption: 500,
    crossCoupons: [
      { id: 'coupon_1', name: '커피 할인', discountType: 'FIXED', discountValue: 1000 },
    ],
    ...overrides,
  });

  const createMockToken = (overrides = {}) => ({
    id: 'token_123',
    partnershipId: 'partnership_123',
    redeemedAt: new Date('2024-06-15'),
    selectedCrossCouponId: 'coupon_1',
    selectedCrossCoupon: {
      id: 'coupon_1',
      name: '커피 할인',
      discountType: 'FIXED',
      discountValue: 1000,
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SettlementService();
  });

  describe('calculateSettlement', () => {
    it('should throw error when partnership not found', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(null);

      await expect(
        service.calculateSettlement('invalid_id', 2024, 6)
      ).rejects.toThrow('파트너십을 찾을 수 없습니다');
    });

    it('should calculate settlement with no redemptions', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(createMockPartnership());
      mockPrisma.mealToken.findMany.mockResolvedValue([]);

      const result = await service.calculateSettlement('partnership_123', 2024, 6);

      expect(result.partnershipId).toBe('partnership_123');
      expect(result.period).toEqual({ year: 2024, month: 6 });
      expect(result.totalRedemptions).toBe(0);
      expect(result.totalDiscountAmount).toBe(0);
      expect(result.totalCommission).toBe(0);
      expect(result.details).toHaveLength(0);
      expect(result.status).toBe('CALCULATED');
    });

    it('should calculate settlement with multiple redemptions', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(createMockPartnership());
      mockPrisma.mealToken.findMany.mockResolvedValue([
        createMockToken({ id: 'token_1' }),
        createMockToken({ id: 'token_2' }),
        createMockToken({ id: 'token_3' }),
      ]);

      const result = await service.calculateSettlement('partnership_123', 2024, 6);

      expect(result.totalRedemptions).toBe(3);
      expect(result.totalDiscountAmount).toBe(3000); // 3 * 1000
      expect(result.totalCommission).toBe(1500); // 3 * 500
      expect(result.details).toHaveLength(1);
      expect(result.details[0]).toEqual({
        crossCouponId: 'coupon_1',
        crossCouponName: '커피 할인',
        redemptionCount: 3,
        discountAmount: 3000,
        commission: 1500,
      });
    });

    it('should calculate settlement with multiple cross coupons', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(createMockPartnership());
      mockPrisma.mealToken.findMany.mockResolvedValue([
        createMockToken({
          id: 'token_1',
          selectedCrossCouponId: 'coupon_1',
          selectedCrossCoupon: { id: 'coupon_1', name: '커피 할인', discountType: 'FIXED', discountValue: 1000 },
        }),
        createMockToken({
          id: 'token_2',
          selectedCrossCouponId: 'coupon_2',
          selectedCrossCoupon: { id: 'coupon_2', name: '디저트 할인', discountType: 'FIXED', discountValue: 2000 },
        }),
        createMockToken({
          id: 'token_3',
          selectedCrossCouponId: 'coupon_1',
          selectedCrossCoupon: { id: 'coupon_1', name: '커피 할인', discountType: 'FIXED', discountValue: 1000 },
        }),
      ]);

      const result = await service.calculateSettlement('partnership_123', 2024, 6);

      expect(result.totalRedemptions).toBe(3);
      expect(result.totalDiscountAmount).toBe(4000); // 2*1000 + 1*2000
      expect(result.totalCommission).toBe(1500); // 3 * 500
      expect(result.details).toHaveLength(2);
    });

    it('should use correct date range for month', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(createMockPartnership());
      mockPrisma.mealToken.findMany.mockResolvedValue([]);

      await service.calculateSettlement('partnership_123', 2024, 6);

      expect(mockPrisma.mealToken.findMany).toHaveBeenCalledWith({
        where: {
          partnershipId: 'partnership_123',
          redeemedAt: {
            gte: new Date(2024, 5, 1), // June 1, 2024
            lte: new Date(2024, 6, 0, 23, 59, 59, 999), // June 30, 2024 23:59:59
          },
          selectedCrossCouponId: { not: null },
        },
        include: {
          selectedCrossCoupon: true,
        },
      });
    });

    it('should use custom commission rate from partnership', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(
        createMockPartnership({ commissionPerRedemption: 1000 })
      );
      mockPrisma.mealToken.findMany.mockResolvedValue([
        createMockToken(),
        createMockToken({ id: 'token_2' }),
      ]);

      const result = await service.calculateSettlement('partnership_123', 2024, 6);

      expect(result.totalCommission).toBe(2000); // 2 * 1000
    });

    it('should use default commission rate when not set', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(
        createMockPartnership({ commissionPerRedemption: null })
      );
      mockPrisma.mealToken.findMany.mockResolvedValue([createMockToken()]);

      const result = await service.calculateSettlement('partnership_123', 2024, 6);

      expect(result.totalCommission).toBe(500); // Default rate
    });
  });

  describe('getOrCreateSettlement', () => {
    it('should return existing settlement if found', async () => {
      const existingSettlement = {
        id: 'settlement_123',
        partnershipId: 'partnership_123',
        periodStart: new Date(2024, 5, 1),
        periodEnd: new Date(2024, 5, 30),
        totalRedemptions: 10,
        commissionPerUnit: 500,
        totalCommission: 5000,
        status: 'PENDING',
      };
      mockPrisma.crossCouponSettlement.findFirst.mockResolvedValue(existingSettlement);

      const result = await service.getOrCreateSettlement('partnership_123', 2024, 6);

      expect(result).toEqual(existingSettlement);
      expect(mockPrisma.crossCouponSettlement.create).not.toHaveBeenCalled();
    });

    it('should create new settlement if not found', async () => {
      mockPrisma.crossCouponSettlement.findFirst.mockResolvedValue(null);
      mockPrisma.partnership.findUnique
        .mockResolvedValueOnce(createMockPartnership())
        .mockResolvedValueOnce({ commissionPerRedemption: 500 });
      mockPrisma.mealToken.findMany.mockResolvedValue([]);
      mockPrisma.crossCouponSettlement.create.mockResolvedValue({
        id: 'new_settlement',
        partnershipId: 'partnership_123',
        periodStart: new Date(2024, 5, 1),
        periodEnd: new Date(2024, 5, 30, 23, 59, 59, 999),
        totalRedemptions: 0,
        commissionPerUnit: 500,
        totalCommission: 0,
        status: 'PENDING',
      });

      const result = await service.getOrCreateSettlement('partnership_123', 2024, 6);

      expect(mockPrisma.crossCouponSettlement.create).toHaveBeenCalledOnce();
      expect(result.status).toBe('PENDING');
    });
  });

  describe('getStoreSettlements', () => {
    it('should get settlements for a store', async () => {
      const mockSettlements = [
        {
          id: 'settlement_1',
          partnershipId: 'partnership_123',
          periodStart: new Date(2024, 5, 1),
          totalRedemptions: 10,
          totalCommission: 5000,
          partnership: createMockPartnership(),
        },
      ];
      mockPrisma.crossCouponSettlement.findMany.mockResolvedValue(mockSettlements);
      mockPrisma.crossCouponSettlement.count.mockResolvedValue(1);

      const result = await service.getStoreSettlements('store_dist_123');

      expect(result.settlements).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.crossCouponSettlement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            partnership: {
              OR: [
                { distributorStoreId: 'store_dist_123' },
                { providerStoreId: 'store_dist_123' },
              ],
            },
          },
        })
      );
    });

    it('should filter by year when provided', async () => {
      mockPrisma.crossCouponSettlement.findMany.mockResolvedValue([]);
      mockPrisma.crossCouponSettlement.count.mockResolvedValue(0);

      await service.getStoreSettlements('store_123', { year: 2024 });

      expect(mockPrisma.crossCouponSettlement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            periodStart: {
              gte: new Date(2024, 0, 1),
              lt: new Date(2025, 0, 1),
            },
          }),
        })
      );
    });

    it('should filter by partnershipId when provided', async () => {
      mockPrisma.crossCouponSettlement.findMany.mockResolvedValue([]);
      mockPrisma.crossCouponSettlement.count.mockResolvedValue(0);

      await service.getStoreSettlements('store_123', { partnershipId: 'partnership_456' });

      expect(mockPrisma.crossCouponSettlement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            partnershipId: 'partnership_456',
          }),
        })
      );
    });

    it('should respect limit and offset', async () => {
      mockPrisma.crossCouponSettlement.findMany.mockResolvedValue([]);
      mockPrisma.crossCouponSettlement.count.mockResolvedValue(0);

      await service.getStoreSettlements('store_123', { limit: 5, offset: 10 });

      expect(mockPrisma.crossCouponSettlement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        })
      );
    });
  });

  describe('updateSettlementStatus', () => {
    it('should update settlement status to CONFIRMED', async () => {
      mockPrisma.crossCouponSettlement.update.mockResolvedValue({
        id: 'settlement_123',
        status: 'CONFIRMED',
      });

      const result = await service.updateSettlementStatus('settlement_123', 'CONFIRMED');

      expect(mockPrisma.crossCouponSettlement.update).toHaveBeenCalledWith({
        where: { id: 'settlement_123' },
        data: { status: 'CONFIRMED' },
      });
    });

    it('should update settlement status to PAID with paidAt', async () => {
      const paidAt = new Date('2024-07-01');
      mockPrisma.crossCouponSettlement.update.mockResolvedValue({
        id: 'settlement_123',
        status: 'PAID',
        paidAt,
      });

      const result = await service.updateSettlementStatus('settlement_123', 'PAID', paidAt);

      expect(mockPrisma.crossCouponSettlement.update).toHaveBeenCalledWith({
        where: { id: 'settlement_123' },
        data: { status: 'PAID', paidAt },
      });
    });
  });

  describe('generateMonthlySettlements', () => {
    it('should generate settlements for all active partnerships', async () => {
      const mockPartnerships = [
        { id: 'partnership_1' },
        { id: 'partnership_2' },
      ];
      mockPrisma.partnership.findMany.mockResolvedValue(mockPartnerships);
      mockPrisma.crossCouponSettlement.findFirst.mockResolvedValue(null);
      mockPrisma.partnership.findUnique.mockResolvedValue(createMockPartnership());
      mockPrisma.mealToken.findMany.mockResolvedValue([]);
      mockPrisma.crossCouponSettlement.create.mockResolvedValue({ id: 'new_settlement' });

      const results = await service.generateMonthlySettlements(2024, 6);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle errors for individual partnerships', async () => {
      const mockPartnerships = [
        { id: 'partnership_1' },
        { id: 'partnership_2' },
      ];
      mockPrisma.partnership.findMany.mockResolvedValue(mockPartnerships);
      mockPrisma.crossCouponSettlement.findFirst
        .mockResolvedValueOnce(null) // First partnership - no existing settlement
        .mockResolvedValueOnce(null); // Second partnership - no existing settlement
      // First partnership: calculateSettlement calls findUnique once, getOrCreateSettlement calls again
      // Second partnership: calculateSettlement returns null to trigger error
      mockPrisma.partnership.findUnique
        .mockResolvedValueOnce(createMockPartnership({ id: 'partnership_1' })) // First: calculateSettlement
        .mockResolvedValueOnce({ commissionPerRedemption: 500 }) // First: getOrCreateSettlement
        .mockResolvedValueOnce(null); // Second: calculateSettlement fails
      mockPrisma.mealToken.findMany.mockResolvedValue([]);
      mockPrisma.crossCouponSettlement.create.mockResolvedValue({ id: 'settlement_1' });

      const results = await service.generateMonthlySettlements(2024, 6);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it('should only process active partnerships', async () => {
      mockPrisma.partnership.findMany.mockResolvedValue([]);

      await service.generateMonthlySettlements(2024, 6);

      expect(mockPrisma.partnership.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
    });
  });
});
