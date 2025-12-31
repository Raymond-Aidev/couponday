import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';
import { checkCouponAvailability } from '../coupon/services/coupon-availability.service.js';

export interface RedemptionInput {
  savedCouponId?: string;
  couponId?: string;
  customerId?: string;
  orderAmount?: number;
  orderItems?: Array<{
    itemId: string;
    quantity: number;
    price: number;
  }>;
}

export class RedemptionService {
  /**
   * Process coupon redemption (called by store)
   */
  async redeemCoupon(storeId: string, input: RedemptionInput) {
    // Get saved coupon or coupon directly
    let couponId: string;
    let customerId: string | undefined;
    let savedCouponId: string | undefined;

    if (input.savedCouponId) {
      // Redeeming from customer's saved coupon
      const savedCoupon = await prisma.savedCoupon.findUnique({
        where: { id: input.savedCouponId },
        include: { coupon: true },
      });

      if (!savedCoupon) {
        throw createError(ErrorCodes.COUPON_007);
      }

      if (savedCoupon.status === 'USED') {
        throw createError(ErrorCodes.COUPON_005);
      }

      if (savedCoupon.status === 'EXPIRED' || savedCoupon.expiresAt < new Date()) {
        throw createError(ErrorCodes.COUPON_006);
      }

      // Verify coupon belongs to this store
      if (savedCoupon.coupon.storeId !== storeId) {
        throw createError(ErrorCodes.COUPON_007);
      }

      couponId = savedCoupon.couponId;
      customerId = savedCoupon.customerId;
      savedCouponId = savedCoupon.id;
    } else if (input.couponId) {
      // Direct coupon redemption (walk-in customer without app)
      const coupon = await prisma.coupon.findUnique({
        where: { id: input.couponId },
      });

      if (!coupon || coupon.storeId !== storeId) {
        throw createError(ErrorCodes.COUPON_007);
      }

      couponId = coupon.id;
      customerId = input.customerId;
    } else {
      throw createError(ErrorCodes.VALIDATION_001, { message: 'savedCouponId or couponId required' });
    }

    // Get coupon and check availability
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw createError(ErrorCodes.COUPON_007);
    }

    const availability = await checkCouponAvailability(coupon, customerId);
    if (!availability.isAvailable) {
      throw createError(ErrorCodes.VALIDATION_001, {
        reasonCode: availability.reasonCode,
        message: availability.reason || '쿠폰을 사용할 수 없습니다',
      });
    }

    // Calculate discount amount
    const discountAmount = this.calculateDiscount(coupon, input.orderAmount);
    const finalAmount = input.orderAmount ? input.orderAmount - discountAmount : undefined;

    // Create redemption record
    const redemption = await prisma.$transaction(async (tx) => {
      // Create redemption
      const newRedemption = await tx.redemption.create({
        data: {
          couponId,
          savedCouponId,
          customerId,
          storeId,
          orderAmount: input.orderAmount,
          discountAmount,
          finalAmount,
          orderItems: input.orderItems,
        },
      });

      // Update saved coupon status if applicable
      if (savedCouponId) {
        await tx.savedCoupon.update({
          where: { id: savedCouponId },
          data: {
            status: 'USED',
            usedAt: new Date(),
            redemptionId: newRedemption.id,
          },
        });
      }

      // Update coupon stats
      await tx.coupon.update({
        where: { id: couponId },
        data: {
          statsRedeemed: { increment: 1 },
          statsRedemptionRate: {
            set: await this.calculateRedemptionRate(tx, couponId),
          },
        },
      });

      // Update customer stats if applicable
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            statsCouponsUsed: { increment: 1 },
            statsTotalSavedAmount: { increment: discountAmount },
          },
        });
      }

      // Update or create daily stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hour = new Date().getHours();

      await tx.couponDailyStats.upsert({
        where: {
          couponId_date: { couponId, date: today },
        },
        create: {
          couponId,
          date: today,
          redeemedCount: 1,
          redeemedByHour: { [hour]: 1 },
          totalDiscountAmount: discountAmount,
        },
        update: {
          redeemedCount: { increment: 1 },
          totalDiscountAmount: { increment: discountAmount },
          // Note: redeemedByHour would need special handling for JSON update
        },
      });

      return newRedemption;
    });

    return {
      redemption,
      discountAmount,
      finalAmount,
    };
  }

  /**
   * Calculate discount based on coupon type
   */
  private calculateDiscount(
    coupon: { discountType: string; discountValue: number | null; discountCondition: any },
    orderAmount?: number
  ): number {
    const value = coupon.discountValue ?? 0;

    switch (coupon.discountType) {
      case 'FIXED':
        return value;

      case 'PERCENTAGE':
        if (!orderAmount) return 0;
        return Math.floor((orderAmount * value) / 100);

      case 'BOGO':
        // Buy one get one free - value is the item price
        return value;

      case 'BUNDLE':
        // Bundle discount - value is the discount amount
        return value;

      case 'FREEBIE':
        // Free item - value is the item price
        return value;

      case 'CONDITIONAL':
        // Check condition
        const condition = coupon.discountCondition;
        if (condition?.minAmount && orderAmount && orderAmount >= condition.minAmount) {
          return condition.discountValue ?? value;
        }
        return 0;

      default:
        return value;
    }
  }

  /**
   * Calculate redemption rate
   */
  private async calculateRedemptionRate(tx: any, couponId: string): Promise<number> {
    const coupon = await tx.coupon.findUnique({
      where: { id: couponId },
      select: { statsIssued: true, statsRedeemed: true },
    });

    if (!coupon || coupon.statsIssued === 0) return 0;
    return (coupon.statsRedeemed + 1) / coupon.statsIssued;
  }

  /**
   * Get redemption history for store
   */
  async getStoreRedemptions(storeId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    couponId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { storeId };

    if (options?.couponId) {
      where.couponId = options.couponId;
    }

    if (options?.startDate || options?.endDate) {
      where.redeemedAt = {};
      if (options.startDate) where.redeemedAt.gte = options.startDate;
      if (options.endDate) where.redeemedAt.lte = options.endDate;
    }

    const [redemptions, total] = await Promise.all([
      prisma.redemption.findMany({
        where,
        include: {
          coupon: { select: { name: true, discountType: true } },
          customer: { select: { nickname: true } },
        },
        orderBy: { redeemedAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.redemption.count({ where }),
    ]);

    return { redemptions, total };
  }
}
