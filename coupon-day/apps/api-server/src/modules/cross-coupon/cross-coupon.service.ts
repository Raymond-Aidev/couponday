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

  /**
   * Get cross coupon statistics
   * PRD 4.5.3 - 크로스 쿠폰 성과 분석
   */
  async getCrossCouponStats(storeId: string, crossCouponId: string) {
    const crossCoupon = await prisma.crossCoupon.findFirst({
      where: {
        id: crossCouponId,
        OR: [
          { providerStoreId: storeId },
          { partnership: { distributorStoreId: storeId } },
        ],
      },
      include: {
        partnership: {
          select: {
            distributorStore: { select: { id: true, name: true } },
            providerStore: { select: { id: true, name: true } },
            commissionPerRedemption: true,
          },
        },
      },
    });

    if (!crossCoupon) {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: '크로스 쿠폰을 찾을 수 없습니다'
      });
    }

    // Get daily stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.mealToken.groupBy({
      by: ['selectedAt'],
      where: {
        selectedCrossCouponId: crossCouponId,
        selectedAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Get redemption stats
    const redemptionStats = await prisma.mealToken.groupBy({
      by: ['redeemedAt'],
      where: {
        selectedCrossCouponId: crossCouponId,
        redeemedAt: { gte: thirtyDaysAgo, not: null },
      },
      _count: { id: true },
    });

    // Calculate conversion rate
    const conversionRate = crossCoupon.statsSelected > 0
      ? (crossCoupon.statsRedeemed / crossCoupon.statsSelected * 100).toFixed(1)
      : '0';

    // Estimate revenue impact
    const estimatedRevenue = crossCoupon.statsRedeemed * (crossCoupon.partnership?.commissionPerRedemption ?? 0);

    return {
      crossCoupon: {
        id: crossCoupon.id,
        name: crossCoupon.name,
        discountType: crossCoupon.discountType,
        discountValue: crossCoupon.discountValue,
        isActive: crossCoupon.isActive,
      },
      stats: {
        totalSelected: crossCoupon.statsSelected,
        totalRedeemed: crossCoupon.statsRedeemed,
        conversionRate: parseFloat(conversionRate),
        estimatedRevenue,
      },
      dailyStats: this.aggregateDailyStats(dailyStats, redemptionStats),
      partnership: crossCoupon.partnership,
    };
  }

  /**
   * Get aggregated stats for all cross coupons of a store
   */
  async getStoreCrossCouponSummary(storeId: string) {
    const crossCoupons = await prisma.crossCoupon.findMany({
      where: {
        OR: [
          { providerStoreId: storeId },
          { partnership: { distributorStoreId: storeId } },
        ],
      },
      select: {
        id: true,
        name: true,
        statsSelected: true,
        statsRedeemed: true,
        isActive: true,
        providerStoreId: true,
        partnership: {
          select: {
            distributorStoreId: true,
            commissionPerRedemption: true,
          },
        },
      },
    });

    const asProvider = crossCoupons.filter(c => c.providerStoreId === storeId);
    const asDistributor = crossCoupons.filter(c => c.partnership?.distributorStoreId === storeId);

    const totalSelected = crossCoupons.reduce((sum, c) => sum + c.statsSelected, 0);
    const totalRedeemed = crossCoupons.reduce((sum, c) => sum + c.statsRedeemed, 0);
    const totalRevenue = crossCoupons.reduce(
      (sum, c) => sum + (c.statsRedeemed * (c.partnership?.commissionPerRedemption ?? 0)),
      0
    );

    return {
      summary: {
        totalCrossCoupons: crossCoupons.length,
        activeCrossCoupons: crossCoupons.filter(c => c.isActive).length,
        totalSelected,
        totalRedeemed,
        overallConversionRate: totalSelected > 0
          ? parseFloat((totalRedeemed / totalSelected * 100).toFixed(1))
          : 0,
        totalRevenue,
      },
      byRole: {
        asProvider: {
          count: asProvider.length,
          selected: asProvider.reduce((sum, c) => sum + c.statsSelected, 0),
          redeemed: asProvider.reduce((sum, c) => sum + c.statsRedeemed, 0),
        },
        asDistributor: {
          count: asDistributor.length,
          selected: asDistributor.reduce((sum, c) => sum + c.statsSelected, 0),
          redeemed: asDistributor.reduce((sum, c) => sum + c.statsRedeemed, 0),
        },
      },
      topPerformers: crossCoupons
        .filter(c => c.statsRedeemed > 0)
        .sort((a, b) => b.statsRedeemed - a.statsRedeemed)
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: c.name,
          redeemed: c.statsRedeemed,
          conversionRate: c.statsSelected > 0
            ? parseFloat((c.statsRedeemed / c.statsSelected * 100).toFixed(1))
            : 0,
        })),
    };
  }

  private aggregateDailyStats(
    selectionStats: Array<{ selectedAt: Date | null; _count: { id: number } }>,
    redemptionStats: Array<{ redeemedAt: Date | null; _count: { id: number } }>
  ) {
    const statsMap = new Map<string, { date: string; selected: number; redeemed: number }>();

    selectionStats.forEach(stat => {
      if (stat.selectedAt) {
        const dateKey = stat.selectedAt.toISOString().split('T')[0];
        const existing = statsMap.get(dateKey) || { date: dateKey, selected: 0, redeemed: 0 };
        existing.selected += stat._count.id;
        statsMap.set(dateKey, existing);
      }
    });

    redemptionStats.forEach(stat => {
      if (stat.redeemedAt) {
        const dateKey = stat.redeemedAt.toISOString().split('T')[0];
        const existing = statsMap.get(dateKey) || { date: dateKey, selected: 0, redeemed: 0 };
        existing.redeemed += stat._count.id;
        statsMap.set(dateKey, existing);
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
