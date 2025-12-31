import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';

export interface CrossCouponCreateInput {
  partnershipId: string;
  name: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  redemptionWindow?: string;
  availableTimeStart?: string;
  availableTimeEnd?: string;
  dailyLimit?: number;
}

export interface CrossCouponUpdateInput {
  name?: string;
  description?: string;
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountValue?: number;
  redemptionWindow?: string;
  availableTimeStart?: string;
  availableTimeEnd?: string;
  dailyLimit?: number;
  isActive?: boolean;
}

export class CrossCouponService {
  /**
   * Create cross coupon for partnership
   */
  async createCrossCoupon(storeId: string, input: CrossCouponCreateInput) {
    // Verify partnership exists and store is the provider
    const partnership = await prisma.partnership.findFirst({
      where: {
        id: input.partnershipId,
        providerStoreId: storeId,
        status: 'ACTIVE',
      },
    });

    if (!partnership) {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: '유효한 파트너십을 찾을 수 없습니다'
      });
    }

    const crossCoupon = await prisma.crossCoupon.create({
      data: {
        partnershipId: input.partnershipId,
        providerStoreId: storeId,
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        redemptionWindow: input.redemptionWindow ?? 'next_day',
        availableTimeStart: input.availableTimeStart,
        availableTimeEnd: input.availableTimeEnd,
        dailyLimit: input.dailyLimit ?? 30,
        isActive: true,
      },
      include: {
        partnership: {
          include: {
            distributorStore: { select: { id: true, name: true } },
            providerStore: { select: { id: true, name: true } },
          },
        },
      },
    });

    return crossCoupon;
  }

  /**
   * Get cross coupons for store
   */
  async getCrossCoupons(storeId: string) {
    return prisma.crossCoupon.findMany({
      where: {
        OR: [
          { providerStoreId: storeId },
          { partnership: { distributorStoreId: storeId } },
        ],
      },
      include: {
        partnership: {
          include: {
            distributorStore: { select: { id: true, name: true, category: true } },
            providerStore: { select: { id: true, name: true, category: true } },
          },
        },
        _count: {
          select: { mealTokens: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update cross coupon
   */
  async updateCrossCoupon(storeId: string, crossCouponId: string, input: CrossCouponUpdateInput) {
    // Verify ownership
    const crossCoupon = await prisma.crossCoupon.findFirst({
      where: {
        id: crossCouponId,
        providerStoreId: storeId,
      },
    });

    if (!crossCoupon) {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: '크로스 쿠폰을 찾을 수 없습니다'
      });
    }

    return prisma.crossCoupon.update({
      where: { id: crossCouponId },
      data: {
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        redemptionWindow: input.redemptionWindow,
        availableTimeStart: input.availableTimeStart,
        availableTimeEnd: input.availableTimeEnd,
        dailyLimit: input.dailyLimit,
        isActive: input.isActive,
      },
      include: {
        partnership: {
          include: {
            distributorStore: { select: { id: true, name: true } },
            providerStore: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Delete (deactivate) cross coupon
   */
  async deleteCrossCoupon(storeId: string, crossCouponId: string) {
    const crossCoupon = await prisma.crossCoupon.findFirst({
      where: {
        id: crossCouponId,
        providerStoreId: storeId,
      },
    });

    if (!crossCoupon) {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: '크로스 쿠폰을 찾을 수 없습니다'
      });
    }

    return prisma.crossCoupon.update({
      where: { id: crossCouponId },
      data: { isActive: false },
    });
  }
}
