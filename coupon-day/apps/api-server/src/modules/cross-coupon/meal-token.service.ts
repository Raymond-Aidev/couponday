import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';
import { nanoid } from 'nanoid';

export interface MealTokenIssueInput {
  partnershipId: string;
  customerId?: string;
}

export interface AvailableCrossCoupon {
  id: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number | null;
  redemptionWindow: string;
  availableTimeStart: string | null;
  availableTimeEnd: string | null;
  providerStore: {
    id: string;
    name: string;
    category: { id: string; name: string } | null;
    address: string;
  };
}

export class MealTokenService {
  /**
   * Issue meal token after redemption at distributor store
   * PRD 4.5 - 식사 토큰 시스템
   */
  async issueMealToken(distributorStoreId: string, input: MealTokenIssueInput) {
    // Verify partnership
    const partnership = await prisma.partnership.findFirst({
      where: {
        id: input.partnershipId,
        distributorStoreId,
        status: 'ACTIVE',
      },
      include: {
        crossCoupons: {
          where: { isActive: true },
        },
      },
    });

    if (!partnership) {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: '유효한 파트너십을 찾을 수 없습니다'
      });
    }

    if (partnership.crossCoupons.length === 0) {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: '활성화된 크로스 쿠폰이 없습니다'
      });
    }

    // Generate 8-character unique code
    const tokenCode = nanoid(8).toUpperCase();

    // Calculate expiration based on redemption window
    const firstCoupon = partnership.crossCoupons[0];
    const expiresAt = this.calculateExpiration(firstCoupon?.redemptionWindow ?? 'next_day');

    const mealToken = await prisma.mealToken.create({
      data: {
        tokenCode,
        partnershipId: input.partnershipId,
        distributorStoreId,
        customerId: input.customerId,
        expiresAt,
        status: 'ISSUED',
      },
      include: {
        partnership: {
          include: {
            providerStore: { select: { id: true, name: true } },
            crossCoupons: {
              where: { isActive: true },
              select: { id: true, name: true, discountType: true, discountValue: true },
            },
          },
        },
      },
    });

    return {
      token: mealToken,
      code: tokenCode,
      expiresAt,
      availableCoupons: partnership.crossCoupons.length,
    };
  }

  /**
   * Get available cross coupons for a token code
   */
  async getAvailableCoupons(tokenCode: string): Promise<AvailableCrossCoupon[]> {
    const token = await prisma.mealToken.findUnique({
      where: { tokenCode },
      include: {
        partnership: {
          include: {
            crossCoupons: {
              where: { isActive: true },
              include: {
                providerStore: {
                  select: {
                    id: true,
                    name: true,
                    category: { select: { id: true, name: true } },
                    address: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!token) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '유효하지 않은 토큰입니다' });
    }

    if (token.status !== 'ISSUED') {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: token.status === 'SELECTED' || token.status === 'REDEEMED'
          ? '이미 사용된 토큰입니다'
          : '만료된 토큰입니다'
      });
    }

    if (token.expiresAt < new Date()) {
      // Update token status to expired
      await prisma.mealToken.update({
        where: { id: token.id },
        data: { status: 'EXPIRED' },
      });
      throw createError(ErrorCodes.VALIDATION_001, { message: '만료된 토큰입니다' });
    }

    if (!token.partnership) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '파트너십 정보를 찾을 수 없습니다' });
    }

    // Check time availability for each coupon
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return token.partnership.crossCoupons
      .filter((coupon) => {
        if (coupon.availableTimeStart && coupon.availableTimeEnd) {
          return currentTime >= coupon.availableTimeStart && currentTime <= coupon.availableTimeEnd;
        }
        return true;
      })
      .map((coupon) => ({
        id: coupon.id,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        redemptionWindow: coupon.redemptionWindow,
        availableTimeStart: coupon.availableTimeStart,
        availableTimeEnd: coupon.availableTimeEnd,
        providerStore: coupon.providerStore,
      }));
  }

  /**
   * Select and claim a cross coupon using token
   */
  async selectCoupon(tokenCode: string, crossCouponId: string, customerId?: string) {
    const token = await prisma.mealToken.findUnique({
      where: { tokenCode },
      include: {
        partnership: {
          include: {
            crossCoupons: { where: { id: crossCouponId, isActive: true } },
          },
        },
      },
    });

    if (!token) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '유효하지 않은 토큰입니다' });
    }

    if (token.status !== 'ISSUED') {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: token.status === 'SELECTED' || token.status === 'REDEEMED'
          ? '이미 사용된 토큰입니다'
          : '만료된 토큰입니다'
      });
    }

    if (token.expiresAt < new Date()) {
      await prisma.mealToken.update({
        where: { id: token.id },
        data: { status: 'EXPIRED' },
      });
      throw createError(ErrorCodes.VALIDATION_001, { message: '만료된 토큰입니다' });
    }

    if (!token.partnership) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '파트너십 정보를 찾을 수 없습니다' });
    }

    const crossCoupon = token.partnership.crossCoupons[0];
    if (!crossCoupon) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '해당 크로스 쿠폰을 찾을 수 없습니다' });
    }

    // Check daily limit
    if (crossCoupon.dailyLimit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUsageCount = await prisma.mealToken.count({
        where: {
          selectedCrossCouponId: crossCouponId,
          selectedAt: { gte: today },
        },
      });

      if (todayUsageCount >= crossCoupon.dailyLimit) {
        throw createError(ErrorCodes.VALIDATION_001, { message: '일일 발급 한도가 초과되었습니다' });
      }
    }

    // Update token with selection
    const updatedToken = await prisma.mealToken.update({
      where: { id: token.id },
      data: {
        selectedCrossCouponId: crossCouponId,
        customerId: customerId ?? token.customerId,
        selectedAt: new Date(),
        status: 'SELECTED',
      },
      include: {
        selectedCrossCoupon: {
          include: {
            providerStore: {
              select: { id: true, name: true, address: true },
            },
          },
        },
      },
    });

    return {
      success: true,
      crossCoupon: updatedToken.selectedCrossCoupon,
      message: `${updatedToken.selectedCrossCoupon?.providerStore.name}에서 사용 가능한 쿠폰이 발급되었습니다`,
    };
  }

  /**
   * Get token by code (for store verification)
   */
  async getTokenByCode(code: string) {
    const token = await prisma.mealToken.findUnique({
      where: { tokenCode: code },
      include: {
        partnership: {
          include: {
            distributorStore: { select: { id: true, name: true } },
            providerStore: { select: { id: true, name: true } },
          },
        },
        selectedCrossCoupon: true,
        customer: { select: { id: true, nickname: true } },
      },
    });

    if (!token) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '토큰을 찾을 수 없습니다' });
    }

    return token;
  }

  /**
   * Verify and use token at provider store
   */
  async verifyAndUseToken(providerStoreId: string, tokenCode: string, orderAmount?: number) {
    const token = await prisma.mealToken.findUnique({
      where: { tokenCode },
      include: {
        partnership: true,
        selectedCrossCoupon: true,
      },
    });

    if (!token) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '유효하지 않은 토큰입니다' });
    }

    if (token.status !== 'SELECTED' || !token.selectedCrossCouponId) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '쿠폰이 선택되지 않은 토큰입니다' });
    }

    if (!token.partnership) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '파트너십 정보를 찾을 수 없습니다' });
    }

    if (token.partnership.providerStoreId !== providerStoreId) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '이 매장에서 사용할 수 없는 쿠폰입니다' });
    }

    if (token.redeemedAt) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '이미 사용된 쿠폰입니다' });
    }

    const crossCoupon = token.selectedCrossCoupon!;

    // Calculate discount
    let discountAmount = 0;
    if (crossCoupon.discountType === 'FIXED' && crossCoupon.discountValue) {
      discountAmount = crossCoupon.discountValue;
    } else if (crossCoupon.discountType === 'PERCENTAGE' && orderAmount && crossCoupon.discountValue) {
      discountAmount = Math.floor(orderAmount * (crossCoupon.discountValue / 100));
    }

    // Update token as redeemed
    await prisma.mealToken.update({
      where: { id: token.id },
      data: {
        redeemedAt: new Date(),
        status: 'REDEEMED',
      },
    });

    // Update cross coupon stats
    await prisma.crossCoupon.update({
      where: { id: crossCoupon.id },
      data: {
        statsRedeemed: { increment: 1 },
      },
    });

    return {
      success: true,
      discountAmount,
      crossCoupon: {
        name: crossCoupon.name,
        discountType: crossCoupon.discountType,
        discountValue: crossCoupon.discountValue,
      },
    };
  }

  /**
   * Calculate token expiration based on redemption window
   */
  private calculateExpiration(redemptionWindow: string): Date {
    const now = new Date();

    switch (redemptionWindow) {
      case 'same_day':
        // End of today (23:59:59)
        now.setHours(23, 59, 59, 999);
        return now;

      case 'next_day':
        // End of tomorrow
        now.setDate(now.getDate() + 1);
        now.setHours(23, 59, 59, 999);
        return now;

      case 'within_week':
        // 7 days from now
        now.setDate(now.getDate() + 7);
        now.setHours(23, 59, 59, 999);
        return now;

      default:
        // Default: end of tomorrow
        now.setDate(now.getDate() + 1);
        now.setHours(23, 59, 59, 999);
        return now;
    }
  }
}
