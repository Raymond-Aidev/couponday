import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';

export interface PartnerRecommendation {
  store: {
    id: string;
    name: string;
    category: { id: string; name: string; icon?: string | null };
    address: string;
    distance?: number;
  };
  matchScore: number;
  reasons: string[];
  expectedPerformance: {
    monthlyTokenInflow: number;
    monthlyCouponSelections: number;
    expectedRoi: number;
  };
  categoryTransition: {
    from: string;
    to: string;
    transitionRate: number;
  };
}

/**
 * Partner matching weight configuration
 * PRD 7.3 - 100점 만점 스코어링 가중치 커스터마이징
 */
export interface MatchingWeights {
  categoryTransition: number;  // Default: 40 (카테고리 전환율)
  distance: number;            // Default: 20 (거리)
  priceSimilarity: number;     // Default: 20 (가격대 유사성)
  peakTimeAlignment: number;   // Default: 20 (피크타임 일치)
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  categoryTransition: 40,
  distance: 20,
  priceSimilarity: 20,
  peakTimeAlignment: 20,
};

export class PartnershipService {
  private weights: MatchingWeights = DEFAULT_WEIGHTS;

  /**
   * Set custom matching weights
   */
  setWeights(weights: Partial<MatchingWeights>) {
    // Validate total equals 100
    const newWeights = { ...this.weights, ...weights };
    const total = newWeights.categoryTransition + newWeights.distance +
                  newWeights.priceSimilarity + newWeights.peakTimeAlignment;

    if (total !== 100) {
      throw createError(ErrorCodes.VALIDATION_001, {
        message: `가중치 합계는 100이어야 합니다 (현재: ${total})`
      });
    }

    this.weights = newWeights;
  }

  /**
   * Get current weights
   */
  getWeights(): MatchingWeights {
    return { ...this.weights };
  }

  /**
   * Get AI recommended partners
   * PRD 7.3 기준 - 100점 만점 스코어링
   */
  async getPartnerRecommendations(
    storeId: string,
    role: 'provider' | 'distributor' = 'provider',
    limit = 10,
    customWeights?: Partial<MatchingWeights>
  ): Promise<PartnerRecommendation[]> {
    const myStore = await prisma.store.findUnique({
      where: { id: storeId },
      include: { category: true },
    });

    if (!myStore) {
      throw createError(ErrorCodes.STORE_001);
    }

    // Get existing partnership store IDs to exclude
    const existingPartnerships = await prisma.partnership.findMany({
      where: {
        OR: [{ distributorStoreId: storeId }, { providerStoreId: storeId }],
      },
      select: { distributorStoreId: true, providerStoreId: true },
    });

    const excludeStoreIds = new Set<string>([storeId]);
    existingPartnerships.forEach((p) => {
      excludeStoreIds.add(p.distributorStoreId);
      excludeStoreIds.add(p.providerStoreId);
    });

    // Get nearby stores with different categories
    // Note: In production, use PostGIS ST_DWithin for proper geo query
    const candidates = await prisma.store.findMany({
      where: {
        id: { notIn: Array.from(excludeStoreIds) },
        categoryId: { not: myStore.categoryId },
        status: 'ACTIVE',
      },
      include: { category: true },
      take: 50,
    });

    // Use custom weights if provided, otherwise use instance weights
    const activeWeights = customWeights
      ? { ...this.weights, ...customWeights }
      : this.weights;

    // Score each candidate
    const scored = candidates.map((candidate) => {
      const distance = this.calculateDistance(
        Number(myStore.latitude),
        Number(myStore.longitude),
        Number(candidate.latitude),
        Number(candidate.longitude)
      );
      const score = this.calculateMatchScore(myStore, candidate, distance, activeWeights);

      return {
        store: {
          id: candidate.id,
          name: candidate.name,
          category: {
            id: candidate.category.id,
            name: candidate.category.name,
            icon: candidate.category.icon,
          },
          address: candidate.address,
          distance,
        },
        ...score,
      };
    });

    // Sort by score and return top N
    return scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Calculate match score with configurable weights
   */
  private calculateMatchScore(
    myStore: any,
    candidate: any,
    distance: number,
    weights: MatchingWeights = DEFAULT_WEIGHTS
  ): {
    matchScore: number;
    reasons: string[];
    expectedPerformance: PartnerRecommendation['expectedPerformance'];
    categoryTransition: PartnerRecommendation['categoryTransition'];
  } {
    const reasons: string[] = [];
    let totalScore = 0;

    // 1. Category transition rate (configurable, default: 40 points)
    // In production, this would use actual CategoryFatigueMatrix data
    const rawTransitionScore = this.getTransitionScore(myStore.category.name, candidate.category.name);
    const transitionScore = (rawTransitionScore / 40) * weights.categoryTransition; // Scale to weight
    totalScore += transitionScore;
    const transitionRate = transitionScore / weights.categoryTransition; // Normalize to 0-1

    if (transitionRate >= 0.75) {
      reasons.push(`카테고리 전환율 ${Math.round(transitionRate * 100)}% (${myStore.category.name}→${candidate.category.name})`);
    }

    // 2. Distance (configurable, default: 20 points)
    const rawDistanceScore = this.getDistanceScore(distance);
    const distanceScore = (rawDistanceScore / 20) * weights.distance;
    totalScore += distanceScore;
    if (distanceScore >= weights.distance * 0.75) {
      reasons.push(`거리 ${Math.round(distance)}m로 최적`);
    }

    // 3. Price similarity (configurable, default: 20 points)
    // In production, would use average order data
    const rawPriceScore = 15; // Placeholder
    const priceScore = (rawPriceScore / 20) * weights.priceSimilarity;
    totalScore += priceScore;
    if (priceScore >= weights.priceSimilarity * 0.75) {
      reasons.push('가격대 유사');
    }

    // 4. Peak time alignment (configurable, default: 20 points)
    // In production, would use operating hours analysis
    const rawPeakScore = 15; // Placeholder
    const peakScore = (rawPeakScore / 20) * weights.peakTimeAlignment;
    totalScore += peakScore;
    if (peakScore >= weights.peakTimeAlignment * 0.75) {
      reasons.push('피크타임 일치');
    }

    // Calculate expected performance based on score
    // These are estimates based on match score and typical conversion rates
    const baseMonthlyTokens = 100; // Base assumption: 100 tokens/month for average partnership
    const monthlyTokenInflow = Math.round(baseMonthlyTokens * (totalScore / 100) * 1.5);
    const selectionRate = 0.3 + (transitionRate * 0.2); // 30-50% selection rate
    const monthlyCouponSelections = Math.round(monthlyTokenInflow * selectionRate);
    const redemptionRate = 0.6 + (distanceScore / 100); // 60-80% redemption rate
    const expectedRoi = Number((redemptionRate * (totalScore / 50)).toFixed(2)); // ROI multiplier

    return {
      matchScore: totalScore,
      reasons,
      expectedPerformance: {
        monthlyTokenInflow,
        monthlyCouponSelections,
        expectedRoi,
      },
      categoryTransition: {
        from: myStore.category.name,
        to: candidate.category.name,
        transitionRate: Number(transitionRate.toFixed(2)),
      },
    };
  }

  /**
   * Get transition score based on category pair
   */
  private getTransitionScore(fromCategory: string, toCategory: string): number {
    // Predefined transition rates (in production, from CategoryFatigueMatrix)
    const transitionRates: Record<string, Record<string, number>> = {
      한식: { '카페/디저트': 35, 양식: 20, 일식: 25, 중식: 15 },
      일식: { '카페/디저트': 30, 한식: 20, 양식: 25 },
      중식: { '카페/디저트': 30, 한식: 25, 양식: 20 },
      양식: { '카페/디저트': 35, 한식: 20, 일식: 20 },
      '카페/디저트': { 한식: 15, 일식: 15, 양식: 15, 중식: 15 },
      분식: { '카페/디저트': 30, 한식: 20 },
    };

    return transitionRates[fromCategory]?.[toCategory] ?? 10;
  }

  /**
   * Get distance score
   */
  private getDistanceScore(distance: number): number {
    if (distance >= 100 && distance <= 300) return 20;
    if (distance >= 50 && distance < 100) return 15;
    if (distance > 300 && distance <= 400) return 15;
    if (distance < 50) return 10;
    if (distance > 400 && distance <= 500) return 10;
    return 0;
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Request partnership
   */
  async requestPartnership(requestorStoreId: string, targetStoreId: string) {
    // Prevent self-partnership
    if (requestorStoreId === targetStoreId) {
      throw createError(ErrorCodes.PARTNER_002);
    }

    // Check if partnership already exists
    const existing = await prisma.partnership.findFirst({
      where: {
        OR: [
          { distributorStoreId: requestorStoreId, providerStoreId: targetStoreId },
          { distributorStoreId: targetStoreId, providerStoreId: requestorStoreId },
        ],
      },
    });

    if (existing) {
      throw createError(ErrorCodes.PARTNER_001);
    }

    // Create partnership request
    const partnership = await prisma.partnership.create({
      data: {
        distributorStoreId: requestorStoreId,
        providerStoreId: targetStoreId,
        status: 'PENDING',
        requestedBy: requestorStoreId,
      },
      include: {
        distributorStore: { select: { id: true, name: true } },
        providerStore: { select: { id: true, name: true } },
      },
    });

    return partnership;
  }

  /**
   * Respond to partnership request
   * ACID 보장: 트랜잭션으로 상태 검증과 업데이트를 원자적으로 처리
   */
  async respondToPartnership(partnershipId: string, storeId: string, accept: boolean) {
    return prisma.$transaction(async (tx) => {
      // 트랜잭션 내에서 파트너십 조회 (잠금)
      const partnership = await tx.partnership.findUnique({
        where: { id: partnershipId },
      });

      if (!partnership) {
        throw createError(ErrorCodes.VALIDATION_001, { message: '파트너십을 찾을 수 없습니다' });
      }

      // 이미 처리된 요청인지 확인
      if (partnership.status !== 'PENDING') {
        throw createError(ErrorCodes.VALIDATION_001, {
          message: partnership.status === 'ACTIVE'
            ? '이미 수락된 파트너십입니다'
            : '이미 처리된 요청입니다'
        });
      }

      // Verify responder is the target store
      if (partnership.providerStoreId !== storeId && partnership.distributorStoreId !== storeId) {
        throw createError(ErrorCodes.AUTH_001);
      }

      // Verify requester is different from responder
      if (partnership.requestedBy === storeId) {
        throw createError(ErrorCodes.VALIDATION_001, { message: '자신의 요청에는 응답할 수 없습니다' });
      }

      const updated = await tx.partnership.update({
        where: { id: partnershipId },
        data: {
          status: accept ? 'ACTIVE' : 'TERMINATED',
          respondedAt: new Date(),
          ...(accept === false && { terminatedAt: new Date() }),
        },
        include: {
          distributorStore: { select: { id: true, name: true } },
          providerStore: { select: { id: true, name: true } },
        },
      });

      return updated;
    });
  }

  /**
   * Get partnerships for store
   */
  async getPartnerships(storeId: string, status?: string) {
    return prisma.partnership.findMany({
      where: {
        OR: [{ distributorStoreId: storeId }, { providerStoreId: storeId }],
        ...(status && { status: status as any }),
      },
      include: {
        distributorStore: {
          select: { id: true, name: true, category: true, address: true },
        },
        providerStore: {
          select: { id: true, name: true, category: true, address: true },
        },
        crossCoupons: {
          where: { isActive: true },
        },
        _count: {
          select: { mealTokens: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get partnership by ID
   */
  async getPartnershipById(partnershipId: string, storeId: string) {
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
      include: {
        distributorStore: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            category: true,
          },
        },
        providerStore: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            category: true,
          },
        },
        crossCoupons: {
          select: {
            id: true,
            name: true,
            discountType: true,
            discountValue: true,
            isActive: true,
            statsSelected: true,
            statsRedeemed: true,
          },
        },
      },
    });

    if (!partnership) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '파트너십을 찾을 수 없습니다' });
    }

    // Verify store has access to this partnership
    if (partnership.distributorStoreId !== storeId && partnership.providerStoreId !== storeId) {
      throw createError(ErrorCodes.AUTH_001);
    }

    return partnership;
  }
}
