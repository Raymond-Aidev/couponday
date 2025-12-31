import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';

export interface SettlementPeriod {
  year: number;
  month: number;
}

export interface SettlementSummary {
  partnershipId: string;
  period: SettlementPeriod;
  totalRedemptions: number;
  totalDiscountAmount: number;
  totalCommission: number;
  status: string;
  details: SettlementDetail[];
}

export interface SettlementDetail {
  crossCouponId: string;
  crossCouponName: string;
  redemptionCount: number;
  discountAmount: number;
  commission: number;
}

export class SettlementService {
  /**
   * Calculate settlement for a partnership in a specific month
   */
  async calculateSettlement(
    partnershipId: string,
    year: number,
    month: number
  ): Promise<SettlementSummary> {
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
      include: {
        distributorStore: { select: { id: true, name: true } },
        providerStore: { select: { id: true, name: true } },
        crossCoupons: true,
      },
    });

    if (!partnership) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '파트너십을 찾을 수 없습니다' });
    }

    // Calculate period start and end
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all tokens redeemed in this period
    const redeemedTokens = await prisma.mealToken.findMany({
      where: {
        partnershipId,
        redeemedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        selectedCrossCouponId: { not: null },
      },
      include: {
        selectedCrossCoupon: true,
      },
    });

    // Group by cross coupon
    const couponStats = new Map<string, {
      name: string;
      count: number;
      discountAmount: number;
    }>();

    for (const token of redeemedTokens) {
      const coupon = token.selectedCrossCoupon;
      if (!coupon) continue;

      const existing = couponStats.get(coupon.id) ?? {
        name: coupon.name,
        count: 0,
        discountAmount: 0,
      };

      // Calculate discount for this token
      let discount = 0;
      if (coupon.discountType === 'FIXED' && coupon.discountValue) {
        discount = coupon.discountValue;
      }
      // Note: PERCENTAGE calculation would need order amount which isn't stored

      existing.count += 1;
      existing.discountAmount += discount;
      couponStats.set(coupon.id, existing);
    }

    // Calculate commission per redemption
    const commissionPerRedemption = partnership.commissionPerRedemption ?? 500;

    // Build settlement details
    const details: SettlementDetail[] = [];
    let totalRedemptions = 0;
    let totalDiscountAmount = 0;
    let totalCommission = 0;

    for (const [couponId, stats] of couponStats) {
      const commission = stats.count * commissionPerRedemption;
      details.push({
        crossCouponId: couponId,
        crossCouponName: stats.name,
        redemptionCount: stats.count,
        discountAmount: stats.discountAmount,
        commission,
      });
      totalRedemptions += stats.count;
      totalDiscountAmount += stats.discountAmount;
      totalCommission += commission;
    }

    return {
      partnershipId,
      period: { year, month },
      totalRedemptions,
      totalDiscountAmount,
      totalCommission,
      status: 'CALCULATED',
      details,
    };
  }

  /**
   * Get or create settlement record
   */
  async getOrCreateSettlement(
    partnershipId: string,
    year: number,
    month: number
  ) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Check if settlement already exists
    let settlement = await prisma.crossCouponSettlement.findFirst({
      where: {
        partnershipId,
        periodStart: {
          gte: periodStart,
          lt: new Date(year, month, 1),
        },
      },
    });

    if (settlement) {
      return settlement;
    }

    // Calculate settlement
    const calculated = await this.calculateSettlement(partnershipId, year, month);

    // Get commission per unit from partnership
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
      select: { commissionPerRedemption: true },
    });

    // Create settlement record
    settlement = await prisma.crossCouponSettlement.create({
      data: {
        partnershipId,
        periodStart,
        periodEnd,
        totalRedemptions: calculated.totalRedemptions,
        commissionPerUnit: partnership?.commissionPerRedemption ?? 500,
        totalCommission: calculated.totalCommission,
        status: 'PENDING',
      },
    });

    return settlement;
  }

  /**
   * Get settlements for a store
   */
  async getStoreSettlements(
    storeId: string,
    options: {
      year?: number;
      partnershipId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { year, partnershipId, limit = 12, offset = 0 } = options;

    const whereClause: any = {
      partnership: {
        OR: [
          { distributorStoreId: storeId },
          { providerStoreId: storeId },
        ],
      },
    };

    if (partnershipId) {
      whereClause.partnershipId = partnershipId;
    }

    if (year) {
      whereClause.periodStart = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }

    const [settlements, total] = await Promise.all([
      prisma.crossCouponSettlement.findMany({
        where: whereClause,
        include: {
          partnership: {
            include: {
              distributorStore: { select: { id: true, name: true } },
              providerStore: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { periodStart: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.crossCouponSettlement.count({ where: whereClause }),
    ]);

    return { settlements, total };
  }

  /**
   * Update settlement status (for admin or scheduled task)
   */
  async updateSettlementStatus(
    settlementId: string,
    status: 'PENDING' | 'CONFIRMED' | 'PAID',
    paidAt?: Date
  ) {
    return prisma.crossCouponSettlement.update({
      where: { id: settlementId },
      data: {
        status,
        ...(paidAt && { paidAt }),
      },
    });
  }

  /**
   * Generate monthly settlements for all active partnerships
   * (To be called by scheduled job)
   */
  async generateMonthlySettlements(year: number, month: number) {
    const activePartnerships = await prisma.partnership.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const results = [];

    for (const partnership of activePartnerships) {
      try {
        const settlement = await this.getOrCreateSettlement(
          partnership.id,
          year,
          month
        );
        results.push({ partnershipId: partnership.id, settlement, success: true });
      } catch (error) {
        results.push({ partnershipId: partnership.id, error, success: false });
      }
    }

    return results;
  }
}
