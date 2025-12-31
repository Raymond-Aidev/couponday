import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkCouponAvailability } from '../../modules/coupon/services/coupon-availability.service.js';
import { prisma } from '../../database/prisma.js';
import type { Coupon } from '@prisma/client';

// Mock prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    redemption: {
      count: vi.fn(),
    },
  },
}));

describe('CouponAvailabilityService', () => {
  const mockPrisma = prisma as any;

  // Helper to create a valid coupon
  const createValidCoupon = (overrides: Partial<Coupon> = {}): Coupon => ({
    id: 'coupon_test_123',
    storeId: 'store_test_123',
    name: '테스트 쿠폰',
    description: '테스트용 쿠폰입니다',
    type: 'DISCOUNT_AMOUNT',
    discountValue: 2000,
    freeItemName: null,
    minOrderAmount: 10000,
    totalQuantity: null,
    dailyLimit: null,
    perUserLimit: 0,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    availableTimeStart: null,
    availableTimeEnd: null,
    availableDays: [],
    blackoutDates: [],
    status: 'ACTIVE',
    qrCodeUrl: null,
    statsIssued: 100,
    statsRedeemed: 25,
    statsViewCount: 500,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as Coupon);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.redemption.count.mockResolvedValue(0);
  });

  describe('checkCouponAvailability', () => {
    describe('Status Check (Step 1)', () => {
      it('should return unavailable when coupon status is not ACTIVE', async () => {
        const coupon = createValidCoupon({ status: 'PAUSED' });

        const result = await checkCouponAvailability(coupon);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('COUPON_NOT_ACTIVE');
        expect(result.reason).toBe('현재 사용할 수 없는 쿠폰입니다');
      });

      it('should pass when coupon status is ACTIVE', async () => {
        const coupon = createValidCoupon({ status: 'ACTIVE' });
        const now = new Date('2024-06-15T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });
    });

    describe('Validity Period Check (Step 2)', () => {
      it('should return unavailable when coupon has not started yet', async () => {
        const coupon = createValidCoupon({
          validFrom: new Date('2025-01-01'),
          validUntil: new Date('2025-12-31'),
        });
        const now = new Date('2024-06-15T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('NOT_STARTED_YET');
        expect(result.nextAvailable).toEqual(new Date('2025-01-01'));
      });

      it('should return unavailable when coupon has expired', async () => {
        const coupon = createValidCoupon({
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-06-01'),
        });
        const now = new Date('2024-06-15T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('EXPIRED');
      });
    });

    describe('Day of Week Check (Step 3)', () => {
      it('should return unavailable when today is not in available days', async () => {
        const coupon = createValidCoupon({
          availableDays: [1, 2, 3, 4, 5], // Mon-Fri
        });
        // June 15, 2024 is Saturday (6)
        const now = new Date('2024-06-15T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('NOT_AVAILABLE_TODAY');
        expect(result.reason).toBe('오늘은 사용할 수 없는 요일입니다');
      });

      it('should pass when today is in available days', async () => {
        const coupon = createValidCoupon({
          availableDays: [1, 2, 3, 4, 5], // Mon-Fri
        });
        // June 14, 2024 is Friday (5)
        const now = new Date('2024-06-14T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });

      it('should pass when availableDays is empty (all days)', async () => {
        const coupon = createValidCoupon({
          availableDays: [],
        });
        const now = new Date('2024-06-15T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });
    });

    describe('Time Check (Step 4)', () => {
      it('should return unavailable when current time is before available time', async () => {
        const coupon = createValidCoupon({
          availableTimeStart: '11:00',
          availableTimeEnd: '14:00',
        });
        const now = new Date('2024-06-14T09:30:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('NOT_AVAILABLE_NOW');
        expect(result.reason).toContain('11:00~14:00');
      });

      it('should return unavailable when current time is after available time', async () => {
        const coupon = createValidCoupon({
          availableTimeStart: '11:00',
          availableTimeEnd: '14:00',
        });
        const now = new Date('2024-06-14T15:30:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('NOT_AVAILABLE_NOW');
      });

      it('should pass when current time is within available time', async () => {
        const coupon = createValidCoupon({
          availableTimeStart: '11:00',
          availableTimeEnd: '14:00',
        });
        const now = new Date('2024-06-14T12:30:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });
    });

    describe('Blackout Dates Check (Step 5)', () => {
      it('should return unavailable when today is a blackout date', async () => {
        const coupon = createValidCoupon({
          blackoutDates: [new Date('2024-06-14'), new Date('2024-06-15')],
        });
        const now = new Date('2024-06-14T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('BLACKOUT_DATE');
        expect(result.reason).toBe('오늘은 사용할 수 없는 날입니다');
      });

      it('should pass when today is not a blackout date', async () => {
        const coupon = createValidCoupon({
          blackoutDates: [new Date('2024-06-15'), new Date('2024-06-16')],
        });
        const now = new Date('2024-06-14T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });
    });

    describe('Total Quantity Check (Step 6)', () => {
      it('should return unavailable when total quantity is exhausted', async () => {
        const coupon = createValidCoupon({
          totalQuantity: 100,
          statsRedeemed: 100,
        });
        const now = new Date('2024-06-14T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('SOLD_OUT');
        expect(result.reason).toBe('수량이 모두 소진되었습니다');
      });

      it('should pass when total quantity is not set (unlimited)', async () => {
        const coupon = createValidCoupon({
          totalQuantity: null,
          statsRedeemed: 1000,
        });
        const now = new Date('2024-06-14T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });

      it('should pass when quantity remains', async () => {
        const coupon = createValidCoupon({
          totalQuantity: 100,
          statsRedeemed: 50,
        });
        const now = new Date('2024-06-14T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });
    });

    describe('Daily Limit Check (Step 7)', () => {
      it('should return unavailable when daily limit is reached', async () => {
        const coupon = createValidCoupon({
          dailyLimit: 50,
        });
        const now = new Date('2024-06-14T12:00:00');
        mockPrisma.redemption.count.mockResolvedValue(50);

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('DAILY_LIMIT_REACHED');
        expect(result.reason).toBe('오늘 사용 가능한 수량이 소진되었습니다');
      });

      it('should pass when daily limit is not reached', async () => {
        const coupon = createValidCoupon({
          dailyLimit: 50,
        });
        const now = new Date('2024-06-14T12:00:00');
        mockPrisma.redemption.count.mockResolvedValue(25);

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
      });
    });

    describe('Per User Limit Check (Step 8)', () => {
      it('should return unavailable when user has reached usage limit', async () => {
        const coupon = createValidCoupon({
          perUserLimit: 3,
          dailyLimit: null, // No daily limit, so only user limit check
        });
        const now = new Date('2024-06-14T12:00:00');
        // Only user limit check will be called since dailyLimit is null
        mockPrisma.redemption.count.mockResolvedValue(3);

        const result = await checkCouponAvailability(coupon, 'customer_123', now);

        expect(result.isAvailable).toBe(false);
        expect(result.reasonCode).toBe('USER_LIMIT_REACHED');
        expect(result.reason).toBe('이미 최대 사용 횟수에 도달했습니다');
      });

      it('should pass when user has not reached usage limit', async () => {
        const coupon = createValidCoupon({
          perUserLimit: 3,
          dailyLimit: null, // No daily limit, so only user limit check
        });
        const now = new Date('2024-06-14T12:00:00');
        // Only user limit check will be called since dailyLimit is null
        mockPrisma.redemption.count.mockResolvedValue(1);

        const result = await checkCouponAvailability(coupon, 'customer_123', now);

        expect(result.isAvailable).toBe(true);
      });

      it('should skip user limit check when no customerId provided', async () => {
        const coupon = createValidCoupon({
          perUserLimit: 3,
          dailyLimit: null,
        });
        const now = new Date('2024-06-14T12:00:00');

        const result = await checkCouponAvailability(coupon, undefined, now);

        expect(result.isAvailable).toBe(true);
        // No DB calls should happen since dailyLimit is null and customerId is not provided
        expect(mockPrisma.redemption.count).not.toHaveBeenCalled();
      });
    });

    describe('Full Availability Check', () => {
      it('should return available when all checks pass', async () => {
        const coupon = createValidCoupon({
          status: 'ACTIVE',
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2025-12-31'),
          availableDays: [1, 2, 3, 4, 5],
          availableTimeStart: '09:00',
          availableTimeEnd: '18:00',
          blackoutDates: [],
          totalQuantity: 100,
          statsRedeemed: 50,
          dailyLimit: 50,
          perUserLimit: 3,
        });
        // Friday, within time
        const now = new Date('2024-06-14T12:00:00');
        mockPrisma.redemption.count
          .mockResolvedValueOnce(25) // daily limit check
          .mockResolvedValueOnce(1); // user limit check

        const result = await checkCouponAvailability(coupon, 'customer_123', now);

        expect(result.isAvailable).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.reasonCode).toBeUndefined();
      });
    });
  });
});
