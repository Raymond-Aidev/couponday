import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';

export interface PartnerRecommendation {
  store: {
    id: string;
    name: string;
    category: { id: string; name: string };
    address: string;
    distance?: number;
  };
  matchScore: number;
  reasons: string[];
  categoryTransition?: {
    from: string;
    to: string;
    transitionRate: number;
  };
}

export class PartnershipService {
  /**
   * Get AI recommended partners
   * PRD 7.3 기준 - 100점 만점 스코어링
   */
  async getPartnerRecommendations(
    storeId: string,
    role: 'provider' | 'distributor' = 'provider',
    limit = 10
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

    // Score each candidate
    const scored = candidates.map((candidate) => {
      const score = this.calculateMatchScore(myStore, candidate);
      return {
        store: {
          id: candidate.id,
          name: candidate.name,
          category: { id: candidate.category.id, name: candidate.category.name },
          address: candidate.address,
          distance: this.calculateDistance(
            Number(myStore.latitude),
            Number(myStore.longitude),
            Number(candidate.latitude),
            Number(candidate.longitude)
          ),
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
   * Calculate match score (total 100 points)
   */
  private calculateMatchScore(
    myStore: any,
    candidate: any
  ): { matchScore: number; reasons: string[]; categoryTransition?: any } {
    const reasons: string[] = [];
    let totalScore = 0;

    // 1. Category transition rate (40 points)
    // In production, this would use actual CategoryFatigueMatrix data
    const transitionScore = this.getTransitionScore(myStore.category.name, candidate.category.name);
    totalScore += transitionScore;
    if (transitionScore >= 30) {
      reasons.push(`${myStore.category.name}에서 ${candidate.category.name}으로의 전환율이 높습니다`);
    }

    // 2. Distance (20 points)
    const distance = this.calculateDistance(
      Number(myStore.latitude),
      Number(myStore.longitude),
      Number(candidate.latitude),
      Number(candidate.longitude)
    );
    const distanceScore = this.getDistanceScore(distance);
    totalScore += distanceScore;
    if (distanceScore >= 15) {
      reasons.push(`적절한 거리(${Math.round(distance)}m)에 위치해 있습니다`);
    }

    // 3. Price similarity (20 points) - would need average order data
    // For now, give partial score
    const priceScore = 15;
    totalScore += priceScore;

    // 4. Peak time alignment (20 points) - would need operating hours analysis
    // For now, give partial score
    const peakScore = 15;
    totalScore += peakScore;

    return {
      matchScore: totalScore,
      reasons,
      categoryTransition: {
        from: myStore.category.name,
        to: candidate.category.name,
        transitionRate: transitionScore / 40, // Normalize to 0-1
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
   */
  async respondToPartnership(partnershipId: string, storeId: string, accept: boolean) {
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '파트너십을 찾을 수 없습니다' });
    }

    // Verify responder is the target store
    if (partnership.providerStoreId !== storeId && partnership.distributorStoreId !== storeId) {
      throw createError(ErrorCodes.AUTH_001);
    }

    // Verify requester is different from responder
    if (partnership.requestedBy === storeId) {
      throw createError(ErrorCodes.VALIDATION_001, { message: '자신의 요청에는 응답할 수 없습니다' });
    }

    const updated = await prisma.partnership.update({
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
}
