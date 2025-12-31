import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MealTokenService } from '../../modules/cross-coupon/meal-token.service.js';
import { prisma } from '../../database/prisma.js';

// Mock prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    partnership: {
      findFirst: vi.fn(),
    },
    mealToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    crossCoupon: {
      update: vi.fn(),
    },
  },
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'ABCD1234'),
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

describe('MealTokenService', () => {
  let service: MealTokenService;
  const mockPrisma = prisma as any;

  const createMockPartnership = (overrides = {}) => ({
    id: 'partnership_123',
    distributorStoreId: 'store_dist_123',
    providerStoreId: 'store_prov_123',
    status: 'ACTIVE',
    crossCoupons: [
      {
        id: 'crosscoupon_123',
        name: '커피 1000원 할인',
        discountType: 'FIXED',
        discountValue: 1000,
        redemptionWindow: 'next_day',
        isActive: true,
        dailyLimit: 50,
        availableTimeStart: null,
        availableTimeEnd: null,
      },
    ],
    ...overrides,
  });

  const createMockToken = (overrides = {}) => ({
    id: 'token_123',
    tokenCode: 'ABCD1234',
    partnershipId: 'partnership_123',
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

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MealTokenService();
  });

  describe('issueMealToken', () => {
    it('should throw error when partnership not found', async () => {
      mockPrisma.partnership.findFirst.mockResolvedValue(null);

      await expect(
        service.issueMealToken('store_dist_123', { partnershipId: 'invalid_id' })
      ).rejects.toThrow('유효한 파트너십을 찾을 수 없습니다');
    });

    it('should throw error when no active cross coupons exist', async () => {
      mockPrisma.partnership.findFirst.mockResolvedValue({
        ...createMockPartnership(),
        crossCoupons: [],
      });

      await expect(
        service.issueMealToken('store_dist_123', { partnershipId: 'partnership_123' })
      ).rejects.toThrow('활성화된 크로스 쿠폰이 없습니다');
    });

    it('should issue token successfully', async () => {
      const mockPartnership = createMockPartnership();
      mockPrisma.partnership.findFirst.mockResolvedValue(mockPartnership);
      mockPrisma.mealToken.create.mockResolvedValue({
        ...createMockToken(),
        partnership: mockPartnership,
      });

      const result = await service.issueMealToken('store_dist_123', {
        partnershipId: 'partnership_123',
      });

      expect(result.code).toBe('ABCD1234');
      expect(result.availableCoupons).toBe(1);
      expect(result.expiresAt).toBeDefined();
    });

    it('should set correct expiration for different redemption windows', async () => {
      const testCases = [
        { redemptionWindow: 'same_day', expectedHours: 0 },
        { redemptionWindow: 'next_day', expectedDays: 1 },
        { redemptionWindow: 'within_week', expectedDays: 7 },
      ];

      for (const testCase of testCases) {
        mockPrisma.partnership.findFirst.mockResolvedValue({
          ...createMockPartnership(),
          crossCoupons: [
            { ...createMockPartnership().crossCoupons[0], redemptionWindow: testCase.redemptionWindow },
          ],
        });
        mockPrisma.mealToken.create.mockResolvedValue(createMockToken());

        const result = await service.issueMealToken('store_dist_123', {
          partnershipId: 'partnership_123',
        });

        expect(result.expiresAt).toBeDefined();
      }
    });
  });

  describe('getAvailableCoupons', () => {
    it('should throw error for invalid token', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue(null);

      await expect(service.getAvailableCoupons('INVALID')).rejects.toThrow(
        '유효하지 않은 토큰입니다'
      );
    });

    it('should throw error for already used token', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        status: 'REDEEMED',
      });

      await expect(service.getAvailableCoupons('ABCD1234')).rejects.toThrow(
        '이미 사용된 토큰입니다'
      );
    });

    it('should throw error for expired token and update status', async () => {
      const expiredToken = {
        ...createMockToken(),
        expiresAt: new Date(Date.now() - 1000), // expired
        partnership: createMockPartnership(),
      };
      mockPrisma.mealToken.findUnique.mockResolvedValue(expiredToken);
      mockPrisma.mealToken.update.mockResolvedValue({ ...expiredToken, status: 'EXPIRED' });

      await expect(service.getAvailableCoupons('ABCD1234')).rejects.toThrow(
        '만료된 토큰입니다'
      );
      expect(mockPrisma.mealToken.update).toHaveBeenCalledWith({
        where: { id: 'token_123' },
        data: { status: 'EXPIRED' },
      });
    });

    it('should return available cross coupons', async () => {
      const mockCrossCoupon = {
        id: 'crosscoupon_123',
        name: '커피 1000원 할인',
        description: '식사 후 커피 할인',
        discountType: 'FIXED',
        discountValue: 1000,
        redemptionWindow: 'next_day',
        availableTimeStart: null,
        availableTimeEnd: null,
        isActive: true,
        providerStore: {
          id: 'store_prov_123',
          name: '카페A',
          category: { id: 'cat_cafe', name: '카페/디저트' },
          address: '서울시 강남구 카페로 456',
        },
      };

      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        partnership: {
          ...createMockPartnership(),
          crossCoupons: [mockCrossCoupon],
        },
      });

      const result = await service.getAvailableCoupons('ABCD1234');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('crosscoupon_123');
      expect(result[0].name).toBe('커피 1000원 할인');
      expect(result[0].providerStore.name).toBe('카페A');
    });

    it('should filter coupons by available time', async () => {
      const now = new Date();
      const currentHour = now.getHours();

      const mockCoupons = [
        {
          id: 'coupon_available',
          name: '지금 사용 가능',
          description: null,
          discountType: 'FIXED',
          discountValue: 1000,
          redemptionWindow: 'next_day',
          availableTimeStart: `${String(currentHour - 1).padStart(2, '0')}:00`,
          availableTimeEnd: `${String(currentHour + 1).padStart(2, '0')}:00`,
          isActive: true,
          providerStore: { id: 'store_1', name: '가게1', category: null, address: '주소1' },
        },
        {
          id: 'coupon_unavailable',
          name: '시간 외',
          description: null,
          discountType: 'FIXED',
          discountValue: 1000,
          redemptionWindow: 'next_day',
          availableTimeStart: `${String(currentHour + 2).padStart(2, '0')}:00`,
          availableTimeEnd: `${String(currentHour + 3).padStart(2, '0')}:00`,
          isActive: true,
          providerStore: { id: 'store_2', name: '가게2', category: null, address: '주소2' },
        },
      ];

      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        partnership: {
          ...createMockPartnership(),
          crossCoupons: mockCoupons,
        },
      });

      const result = await service.getAvailableCoupons('ABCD1234');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('coupon_available');
    });
  });

  describe('selectCoupon', () => {
    it('should throw error for invalid token', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue(null);

      await expect(
        service.selectCoupon('INVALID', 'crosscoupon_123')
      ).rejects.toThrow('유효하지 않은 토큰입니다');
    });

    it('should throw error for already used token', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        status: 'SELECTED',
      });

      await expect(
        service.selectCoupon('ABCD1234', 'crosscoupon_123')
      ).rejects.toThrow('이미 사용된 토큰입니다');
    });

    it('should throw error when cross coupon not found', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        partnership: {
          ...createMockPartnership(),
          crossCoupons: [], // No matching coupon
        },
      });

      await expect(
        service.selectCoupon('ABCD1234', 'crosscoupon_123')
      ).rejects.toThrow('해당 크로스 쿠폰을 찾을 수 없습니다');
    });

    it('should throw error when daily limit exceeded', async () => {
      const mockCrossCoupon = {
        ...createMockPartnership().crossCoupons[0],
        dailyLimit: 50,
      };

      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        partnership: {
          ...createMockPartnership(),
          crossCoupons: [mockCrossCoupon],
        },
      });
      mockPrisma.mealToken.count.mockResolvedValue(50); // Daily limit reached

      await expect(
        service.selectCoupon('ABCD1234', 'crosscoupon_123')
      ).rejects.toThrow('일일 발급 한도가 초과되었습니다');
    });

    it('should select coupon successfully', async () => {
      const mockCrossCoupon = {
        ...createMockPartnership().crossCoupons[0],
        providerStore: { id: 'store_prov_123', name: '카페A', address: '주소' },
      };

      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        partnership: {
          ...createMockPartnership(),
          crossCoupons: [mockCrossCoupon],
        },
      });
      mockPrisma.mealToken.count.mockResolvedValue(10);
      mockPrisma.mealToken.update.mockResolvedValue({
        ...createMockToken(),
        status: 'SELECTED',
        selectedCrossCouponId: 'crosscoupon_123',
        selectedAt: new Date(),
        selectedCrossCoupon: mockCrossCoupon,
      });

      const result = await service.selectCoupon('ABCD1234', 'crosscoupon_123');

      expect(result.success).toBe(true);
      expect(result.crossCoupon).toBeDefined();
      expect(result.message).toContain('카페A');
    });
  });

  describe('getTokenByCode', () => {
    it('should throw error for non-existent token', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue(null);

      await expect(service.getTokenByCode('INVALID')).rejects.toThrow(
        '토큰을 찾을 수 없습니다'
      );
    });

    it('should return token with related data', async () => {
      const mockToken = {
        ...createMockToken(),
        partnership: {
          distributorStore: { id: 'store_dist', name: '배포가게' },
          providerStore: { id: 'store_prov', name: '제공가게' },
        },
        selectedCrossCoupon: null,
        customer: null,
      };

      mockPrisma.mealToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.getTokenByCode('ABCD1234');

      expect(result.tokenCode).toBe('ABCD1234');
      expect(result.partnership).toBeDefined();
    });
  });

  describe('verifyAndUseToken', () => {
    const createSelectedToken = (overrides = {}) => ({
      ...createMockToken(),
      status: 'SELECTED',
      selectedCrossCouponId: 'crosscoupon_123',
      selectedCrossCoupon: {
        id: 'crosscoupon_123',
        name: '커피 1000원 할인',
        discountType: 'FIXED',
        discountValue: 1000,
      },
      partnership: {
        ...createMockPartnership(),
        providerStoreId: 'store_prov_123',
      },
      ...overrides,
    });

    it('should throw error for invalid token', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyAndUseToken('store_prov_123', 'INVALID')
      ).rejects.toThrow('유효하지 않은 토큰입니다');
    });

    it('should throw error when coupon not selected', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createMockToken(),
        status: 'ISSUED', // Not SELECTED
        selectedCrossCouponId: null,
        partnership: createMockPartnership(),
      });

      await expect(
        service.verifyAndUseToken('store_prov_123', 'ABCD1234')
      ).rejects.toThrow('쿠폰이 선택되지 않은 토큰입니다');
    });

    it('should throw error for wrong store', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue(createSelectedToken());

      await expect(
        service.verifyAndUseToken('wrong_store_id', 'ABCD1234')
      ).rejects.toThrow('이 매장에서 사용할 수 없는 쿠폰입니다');
    });

    it('should throw error for already redeemed token', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createSelectedToken(),
        redeemedAt: new Date(),
      });

      await expect(
        service.verifyAndUseToken('store_prov_123', 'ABCD1234')
      ).rejects.toThrow('이미 사용된 쿠폰입니다');
    });

    it('should calculate FIXED discount correctly', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue(createSelectedToken());
      mockPrisma.mealToken.update.mockResolvedValue({});
      mockPrisma.crossCoupon.update.mockResolvedValue({});

      const result = await service.verifyAndUseToken(
        'store_prov_123',
        'ABCD1234',
        10000
      );

      expect(result.success).toBe(true);
      expect(result.discountAmount).toBe(1000);
    });

    it('should calculate PERCENTAGE discount correctly', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue({
        ...createSelectedToken(),
        selectedCrossCoupon: {
          id: 'crosscoupon_123',
          name: '10% 할인',
          discountType: 'PERCENTAGE',
          discountValue: 10,
        },
      });
      mockPrisma.mealToken.update.mockResolvedValue({});
      mockPrisma.crossCoupon.update.mockResolvedValue({});

      const result = await service.verifyAndUseToken(
        'store_prov_123',
        'ABCD1234',
        10000
      );

      expect(result.success).toBe(true);
      expect(result.discountAmount).toBe(1000); // 10% of 10000
    });

    it('should update token and coupon stats after use', async () => {
      mockPrisma.mealToken.findUnique.mockResolvedValue(createSelectedToken());
      mockPrisma.mealToken.update.mockResolvedValue({});
      mockPrisma.crossCoupon.update.mockResolvedValue({});

      await service.verifyAndUseToken('store_prov_123', 'ABCD1234', 10000);

      expect(mockPrisma.mealToken.update).toHaveBeenCalledWith({
        where: { id: 'token_123' },
        data: {
          redeemedAt: expect.any(Date),
          status: 'REDEEMED',
        },
      });

      expect(mockPrisma.crossCoupon.update).toHaveBeenCalledWith({
        where: { id: 'crosscoupon_123' },
        data: {
          statsRedeemed: { increment: 1 },
        },
      });
    });
  });
});
