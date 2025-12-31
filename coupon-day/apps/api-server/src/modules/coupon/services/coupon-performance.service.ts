import { prisma } from '../../../database/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface PerformanceResult {
  couponId: string;
  analysisPeriod: {
    start: Date;
    end: Date;
  };
  baselinePeriod: {
    start: Date;
    end: Date;
  };
  metrics: {
    baselineSales: number;
    actualSales: number;
    salesLift: number;
    salesLiftPercent: number;
    discountCost: number;
    netEffect: number;
    roi: number;
  };
  stats: {
    totalIssued: number;
    totalRedeemed: number;
    redemptionRate: number;
  };
  dailyBreakdown: Array<{
    date: string;
    redeemed: number;
    discountAmount: number;
  }>;
}

/**
 * 쿠폰 성과 분석 (ROI 계산)
 * PRD 7.2 기준
 */
export async function calculateCouponPerformance(
  couponId: string,
  analysisStart?: Date,
  analysisEnd?: Date
): Promise<PerformanceResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: { store: true },
  });

  if (!coupon) {
    throw new Error('Coupon not found');
  }

  // Default analysis period: coupon's valid period or last 30 days
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const periodStart = analysisStart ?? (coupon.validFrom > defaultStart ? coupon.validFrom : defaultStart);
  const periodEnd = analysisEnd ?? (coupon.validUntil < now ? coupon.validUntil : now);

  // Baseline period: same duration, one month before
  const duration = periodEnd.getTime() - periodStart.getTime();
  const baselineEnd = new Date(periodStart);
  const baselineStart = new Date(baselineEnd.getTime() - duration);

  // Get redemption data for analysis period
  const redemptions = await prisma.redemption.findMany({
    where: {
      couponId,
      redeemedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });

  // Calculate metrics
  const totalDiscountAmount = redemptions.reduce((sum, r) => sum + r.discountAmount, 0);
  const totalOrderAmount = redemptions.reduce((sum, r) => sum + (r.orderAmount ?? 0), 0);

  // Get baseline sales (store's sales during baseline period at same conditions)
  const baselineSales = await getBaselineSales(
    coupon.storeId,
    baselineStart,
    baselineEnd,
    coupon.availableDays,
    coupon.availableTimeStart,
    coupon.availableTimeEnd
  );

  // Get actual sales during coupon period
  const actualSales = await getActualSales(
    coupon.storeId,
    periodStart,
    periodEnd,
    coupon.availableDays,
    coupon.availableTimeStart,
    coupon.availableTimeEnd
  );

  // Calculate ROI metrics
  const salesLift = actualSales - baselineSales;
  const salesLiftPercent = baselineSales > 0 ? salesLift / baselineSales : 0;
  const discountCost = totalDiscountAmount;
  const netEffect = salesLift - discountCost;
  const roi = discountCost > 0 ? netEffect / discountCost : 0;

  // Get daily stats
  const dailyStats = await prisma.couponDailyStats.findMany({
    where: {
      couponId,
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate redemption rate
  const redemptionRate = coupon.statsIssued > 0 ? coupon.statsRedeemed / coupon.statsIssued : 0;

  // Save performance record
  await prisma.couponPerformance.upsert({
    where: {
      couponId_analysisPeriodStart: {
        couponId,
        analysisPeriodStart: periodStart,
      },
    },
    create: {
      couponId,
      analysisPeriodStart: periodStart,
      analysisPeriodEnd: periodEnd,
      baselinePeriodStart: baselineStart,
      baselinePeriodEnd: baselineEnd,
      baselineSales,
      actualSales,
      salesLift,
      salesLiftPercent: new Decimal(salesLiftPercent),
      discountCost,
      netEffect,
      roi: new Decimal(roi),
    },
    update: {
      analysisPeriodEnd: periodEnd,
      baselineSales,
      actualSales,
      salesLift,
      salesLiftPercent: new Decimal(salesLiftPercent),
      discountCost,
      netEffect,
      roi: new Decimal(roi),
      calculatedAt: new Date(),
    },
  });

  return {
    couponId,
    analysisPeriod: {
      start: periodStart,
      end: periodEnd,
    },
    baselinePeriod: {
      start: baselineStart,
      end: baselineEnd,
    },
    metrics: {
      baselineSales,
      actualSales,
      salesLift,
      salesLiftPercent: Math.round(salesLiftPercent * 10000) / 100, // Convert to percentage
      discountCost,
      netEffect,
      roi: Math.round(roi * 100) / 100,
    },
    stats: {
      totalIssued: coupon.statsIssued,
      totalRedeemed: coupon.statsRedeemed,
      redemptionRate: Math.round(redemptionRate * 10000) / 100, // Convert to percentage
    },
    dailyBreakdown: dailyStats.map((stat) => ({
      date: stat.date.toISOString().slice(0, 10),
      redeemed: stat.redeemedCount,
      discountAmount: stat.totalDiscountAmount,
    })),
  };
}

/**
 * Get baseline sales for comparison
 * Note: In production, this would integrate with actual POS/sales data
 */
async function getBaselineSales(
  storeId: string,
  start: Date,
  end: Date,
  availableDays: number[],
  timeStart: string | null,
  timeEnd: string | null
): Promise<number> {
  // For now, estimate from redemption data of other coupons
  // In production, this would come from actual sales/POS integration
  const redemptions = await prisma.redemption.aggregate({
    where: {
      storeId,
      redeemedAt: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      orderAmount: true,
    },
  });

  return redemptions._sum.orderAmount ?? 0;
}

/**
 * Get actual sales during coupon period
 */
async function getActualSales(
  storeId: string,
  start: Date,
  end: Date,
  availableDays: number[],
  timeStart: string | null,
  timeEnd: string | null
): Promise<number> {
  const redemptions = await prisma.redemption.aggregate({
    where: {
      storeId,
      redeemedAt: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      orderAmount: true,
    },
  });

  return redemptions._sum.orderAmount ?? 0;
}

/**
 * Generate performance insights
 */
export function generateInsights(performance: PerformanceResult): string[] {
  const insights: string[] = [];
  const { metrics, stats } = performance;

  // ROI insights
  if (metrics.roi > 1) {
    insights.push(`투자 대비 ${Math.round(metrics.roi * 100)}%의 수익을 얻었습니다. 훌륭한 성과입니다!`);
  } else if (metrics.roi > 0) {
    insights.push(`투자 대비 ${Math.round(metrics.roi * 100)}%의 수익을 얻었습니다.`);
  } else if (metrics.roi === 0) {
    insights.push('할인 비용과 매출 증분이 비슷합니다.');
  } else {
    insights.push('할인 비용이 매출 증분보다 큽니다. 쿠폰 조건을 조정해보세요.');
  }

  // Redemption rate insights
  if (stats.redemptionRate > 50) {
    insights.push(`${stats.redemptionRate}%의 높은 사용률을 보였습니다.`);
  } else if (stats.redemptionRate < 10) {
    insights.push(`사용률이 ${stats.redemptionRate}%로 낮습니다. 홍보를 강화해보세요.`);
  }

  // Sales lift insights
  if (metrics.salesLiftPercent > 20) {
    insights.push(`매출이 기준 대비 ${metrics.salesLiftPercent}% 증가했습니다.`);
  }

  return insights;
}
