import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';
import type {
  StoreUpdateInput,
  ItemCreateInput,
  ItemUpdateInput,
  CouponCreateInput,
  CouponUpdateInput,
  CouponStatusUpdateInput,
} from './store.schema.js';

export class StoreService {
  // ==========================================
  // Store Management
  // ==========================================

  async getStore(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        category: true,
        subCategory: true,
      },
    });

    if (!store) {
      throw createError(ErrorCodes.STORE_001);
    }

    return store;
  }

  async updateStore(storeId: string, input: StoreUpdateInput) {
    const store = await prisma.store.update({
      where: { id: storeId },
      data: input,
      include: {
        category: true,
        subCategory: true,
      },
    });

    return store;
  }

  async getDashboard(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get various stats in parallel
    const [
      activeCoupons,
      todayRedemptions,
      weekRedemptions,
      totalSavedCoupons,
      activePartnerships,
    ] = await Promise.all([
      // Active coupons count
      prisma.coupon.count({
        where: {
          storeId,
          status: 'ACTIVE',
          validUntil: { gte: new Date() },
          deletedAt: null,
        },
      }),

      // Today's redemptions
      prisma.redemption.aggregate({
        where: {
          storeId,
          redeemedAt: { gte: today },
        },
        _count: true,
        _sum: { discountAmount: true, orderAmount: true },
      }),

      // This week's redemptions (for trend)
      prisma.redemption.groupBy({
        by: ['redeemedAt'],
        where: {
          storeId,
          redeemedAt: { gte: weekAgo },
        },
        _count: true,
        _sum: { discountAmount: true },
      }),

      // Total saved coupons (engagement)
      prisma.savedCoupon.count({
        where: {
          coupon: { storeId },
          status: 'ACTIVE',
        },
      }),

      // Active partnerships
      prisma.partnership.count({
        where: {
          OR: [{ distributorStoreId: storeId }, { providerStoreId: storeId }],
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      activeCoupons,
      todayStats: {
        redemptions: todayRedemptions._count,
        discountAmount: todayRedemptions._sum.discountAmount ?? 0,
        orderAmount: todayRedemptions._sum.orderAmount ?? 0,
      },
      weeklyTrend: weekRedemptions,
      totalSavedCoupons,
      activePartnerships,
    };
  }

  // ==========================================
  // Item (Menu) Management
  // ==========================================

  async getItems(storeId: string) {
    return prisma.item.findMany({
      where: {
        storeId,
        deletedAt: null,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getItem(storeId: string, itemId: string) {
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        storeId,
        deletedAt: null,
      },
    });

    if (!item) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '메뉴를 찾을 수 없습니다' });
    }

    return item;
  }

  async createItem(storeId: string, input: ItemCreateInput) {
    // Calculate margin rate if cost is provided
    const marginRate = input.cost ? (input.price - input.cost) / input.price : undefined;

    return prisma.item.create({
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        cost: input.cost,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable,
        isPopular: input.isPopular,
        displayOrder: input.displayOrder,
        options: input.options,
        marginRate,
        store: { connect: { id: storeId } },
      },
    });
  }

  async updateItem(storeId: string, itemId: string, input: ItemUpdateInput) {
    // Verify item belongs to store
    await this.getItem(storeId, itemId);

    // Recalculate margin rate if price or cost changed
    let marginRate: number | undefined;
    if (input.price !== undefined || input.cost !== undefined) {
      const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
      const price = input.price ?? existingItem?.price ?? 0;
      const cost = input.cost ?? existingItem?.cost;
      marginRate = cost ? (price - cost) / price : undefined;
    }

    return prisma.item.update({
      where: { id: itemId },
      data: {
        ...input,
        ...(marginRate !== undefined && { marginRate }),
      },
    });
  }

  async deleteItem(storeId: string, itemId: string) {
    // Verify item belongs to store
    await this.getItem(storeId, itemId);

    // Soft delete
    return prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });
  }

  // ==========================================
  // Coupon Management
  // ==========================================

  async getCoupons(storeId: string, status?: string) {
    return prisma.coupon.findMany({
      where: {
        storeId,
        deletedAt: null,
        ...(status && { status: status as any }),
      },
      include: {
        couponItems: {
          include: { item: true },
        },
        _count: {
          select: {
            savedCoupons: true,
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCoupon(storeId: string, couponId: string) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        storeId,
        deletedAt: null,
      },
      include: {
        couponItems: {
          include: { item: true },
        },
        dailyStats: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        _count: {
          select: {
            savedCoupons: true,
            redemptions: true,
          },
        },
      },
    });

    if (!coupon) {
      throw createError(ErrorCodes.COUPON_007);
    }

    return coupon;
  }

  async createCoupon(storeId: string, input: CouponCreateInput) {
    const { targetItemIds, ...couponData } = input;

    return prisma.$transaction(async (tx) => {
      // Create coupon
      const coupon = await tx.coupon.create({
        data: {
          name: couponData.name,
          description: couponData.description,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          discountCondition: couponData.discountCondition,
          targetScope: couponData.targetScope,
          targetCategory: couponData.targetCategory,
          validFrom: couponData.validFrom,
          validUntil: couponData.validUntil,
          availableDays: couponData.availableDays,
          availableTimeStart: couponData.availableTimeStart,
          availableTimeEnd: couponData.availableTimeEnd,
          blackoutDates: couponData.blackoutDates,
          totalQuantity: couponData.totalQuantity,
          dailyLimit: couponData.dailyLimit,
          perUserLimit: couponData.perUserLimit,
          distributionChannels: couponData.distributionChannels,
          status: couponData.status,
          store: { connect: { id: storeId } },
        },
      });

      // Link target items if specified
      if (targetItemIds && targetItemIds.length > 0) {
        await tx.couponItem.createMany({
          data: targetItemIds.map((itemId) => ({
            couponId: coupon.id,
            itemId,
          })),
        });
      }

      return tx.coupon.findUnique({
        where: { id: coupon.id },
        include: {
          couponItems: {
            include: { item: true },
          },
        },
      });
    });
  }

  async updateCoupon(storeId: string, couponId: string, input: CouponUpdateInput) {
    // Verify coupon belongs to store
    await this.getCoupon(storeId, couponId);

    const { targetItemIds, ...couponData } = input;

    return prisma.$transaction(async (tx) => {
      // Update coupon
      const coupon = await tx.coupon.update({
        where: { id: couponId },
        data: couponData,
      });

      // Update target items if specified
      if (targetItemIds !== undefined) {
        // Remove existing links
        await tx.couponItem.deleteMany({
          where: { couponId },
        });

        // Create new links
        if (targetItemIds.length > 0) {
          await tx.couponItem.createMany({
            data: targetItemIds.map((itemId) => ({
              couponId: coupon.id,
              itemId,
            })),
          });
        }
      }

      return tx.coupon.findUnique({
        where: { id: coupon.id },
        include: {
          couponItems: {
            include: { item: true },
          },
        },
      });
    });
  }

  async updateCouponStatus(storeId: string, couponId: string, input: CouponStatusUpdateInput) {
    // Verify coupon belongs to store
    await this.getCoupon(storeId, couponId);

    return prisma.coupon.update({
      where: { id: couponId },
      data: { status: input.status },
    });
  }

  async deleteCoupon(storeId: string, couponId: string) {
    // Verify coupon belongs to store
    await this.getCoupon(storeId, couponId);

    // Soft delete
    return prisma.coupon.update({
      where: { id: couponId },
      data: { deletedAt: new Date() },
    });
  }

  // ==========================================
  // AI Recommendations
  // ==========================================

  async getCouponRecommendations(storeId: string) {
    // Get store info and recent performance
    const [store, recentRedemptions, activeCoupons] = await Promise.all([
      prisma.store.findUnique({
        where: { id: storeId },
        include: { category: true },
      }),
      prisma.redemption.count({
        where: {
          storeId,
          redeemedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.coupon.count({
        where: { storeId, status: 'ACTIVE', deletedAt: null },
      }),
    ]);

    const recommendations = [];

    // Recommendation 1: If no active coupons
    if (activeCoupons === 0) {
      recommendations.push({
        type: 'first_coupon',
        priority: 'high',
        title: '첫 쿠폰을 만들어보세요',
        description: '신규 고객 유치를 위한 할인 쿠폰을 만들어보세요',
        expectedImpact: '신규 고객 유치 효과',
        template: {
          name: '첫 방문 할인',
          discountType: 'FIXED',
          discountValue: 2000,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          perUserLimit: 1,
        },
      });
    }

    // Recommendation 2: Lunch time coupon
    recommendations.push({
      type: 'lunch_special',
      priority: 'medium',
      title: '점심 특가 쿠폰',
      description: '점심시간(11시-14시) 한정 할인으로 직장인 고객을 유치하세요',
      expectedImpact: '점심 매출 20% 증가 예상',
      template: {
        name: '점심 특가 할인',
        discountType: 'FIXED',
        discountValue: 1000,
        availableDays: [1, 2, 3, 4, 5],
        availableTimeStart: '11:00',
        availableTimeEnd: '14:00',
        dailyLimit: 20,
      },
    });

    // Recommendation 3: Weekend coupon
    recommendations.push({
      type: 'weekend_boost',
      priority: 'medium',
      title: '주말 방문 유도',
      description: '주말 매출 향상을 위한 쿠폰을 발행하세요',
      expectedImpact: '주말 방문객 15% 증가 예상',
      template: {
        name: '주말 할인',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        availableDays: [0, 6],
      },
    });

    return recommendations;
  }
}
