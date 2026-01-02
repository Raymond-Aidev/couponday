import { prisma } from '../../database/prisma.js';
import { createError, ErrorCodes } from '../../common/utils/errors.js';

export interface PublicStoreInfo {
  id: string;
  name: string;
  description?: string | null;
  category: {
    id: string;
    name: string;
    icon?: string | null;
  };
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  operatingHours?: any;
  images?: string[];
  activeCoupons: number;
  popularItems?: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  }>;
  partnershipStatus?: 'PENDING' | 'ACTIVE' | null;
  distance?: number;
}

export interface NearbyStoreResult {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    icon?: string | null;
  };
  address: string;
  distance: number;
  activeCoupons: number;
  partnershipStatus: 'PENDING' | 'ACTIVE' | null;
}

interface GetNearbyOptions {
  categoryId?: string;
  limit?: number;
  excludeStoreId?: string;
  requestorStoreId?: string;
}

interface SearchOptions {
  categoryId?: string;
  limit?: number;
}

export class PublicStoreService {
  /**
   * Get nearby stores with distance calculation
   * Note: For production, use PostGIS ST_DWithin for better performance
   */
  async getNearbyStores(
    lat: number,
    lng: number,
    radiusMeters: number,
    options: GetNearbyOptions = {}
  ): Promise<NearbyStoreResult[]> {
    const { categoryId, limit = 20, excludeStoreId, requestorStoreId } = options;

    // Get all active stores (with location)
    const stores = await prisma.store.findMany({
      where: {
        status: 'ACTIVE',
        latitude: { not: null },
        longitude: { not: null },
        ...(categoryId && { categoryId }),
        ...(excludeStoreId && { id: { not: excludeStoreId } }),
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true },
        },
        coupons: {
          where: {
            status: 'ACTIVE',
            validUntil: { gte: new Date() },
            deletedAt: null,
          },
          select: { id: true },
        },
      },
    });

    // Calculate distance and filter by radius
    const storesWithDistance = stores
      .map((store) => ({
        ...store,
        distance: this.calculateDistance(
          lat,
          lng,
          Number(store.latitude),
          Number(store.longitude)
        ),
      }))
      .filter((store) => store.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    // Get partnership statuses if requestor is authenticated
    let partnershipMap = new Map<string, 'PENDING' | 'ACTIVE'>();
    if (requestorStoreId) {
      const partnerships = await prisma.partnership.findMany({
        where: {
          OR: [
            { distributorStoreId: requestorStoreId },
            { providerStoreId: requestorStoreId },
          ],
          status: { in: ['PENDING', 'ACTIVE'] },
        },
        select: {
          distributorStoreId: true,
          providerStoreId: true,
          status: true,
        },
      });

      partnerships.forEach((p) => {
        const partnerStoreId =
          p.distributorStoreId === requestorStoreId
            ? p.providerStoreId
            : p.distributorStoreId;
        partnershipMap.set(partnerStoreId, p.status as 'PENDING' | 'ACTIVE');
      });
    }

    return storesWithDistance.map((store) => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address,
      distance: Math.round(store.distance),
      activeCoupons: store.coupons.length,
      partnershipStatus: partnershipMap.get(store.id) ?? null,
    }));
  }

  /**
   * Get public store information by ID
   */
  async getPublicStoreInfo(
    storeId: string,
    requestorStoreId?: string
  ): Promise<PublicStoreInfo> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        category: {
          select: { id: true, name: true, icon: true },
        },
        items: {
          where: {
            isPopular: true,
            isAvailable: true,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
          take: 5,
          orderBy: { displayOrder: 'asc' },
        },
        coupons: {
          where: {
            status: 'ACTIVE',
            validUntil: { gte: new Date() },
            deletedAt: null,
          },
          select: { id: true },
        },
      },
    });

    if (!store) {
      throw createError(ErrorCodes.STORE_001);
    }

    // Get partnership status if requestor is authenticated
    let partnershipStatus: 'PENDING' | 'ACTIVE' | null = null;
    if (requestorStoreId && requestorStoreId !== storeId) {
      const partnership = await prisma.partnership.findFirst({
        where: {
          OR: [
            { distributorStoreId: requestorStoreId, providerStoreId: storeId },
            { distributorStoreId: storeId, providerStoreId: requestorStoreId },
          ],
          status: { in: ['PENDING', 'ACTIVE'] },
        },
        select: { status: true },
      });
      partnershipStatus = partnership?.status as 'PENDING' | 'ACTIVE' | null;
    }

    return {
      id: store.id,
      name: store.name,
      description: store.description,
      category: store.category,
      address: store.address,
      latitude: store.latitude ? Number(store.latitude) : null,
      longitude: store.longitude ? Number(store.longitude) : null,
      operatingHours: store.operatingHours,
      images: store.images,
      activeCoupons: store.coupons.length,
      popularItems: store.items,
      partnershipStatus,
    };
  }

  /**
   * Search stores by name
   */
  async searchStores(
    query: string,
    options: SearchOptions = {}
  ): Promise<NearbyStoreResult[]> {
    const { categoryId, limit = 20 } = options;

    const stores = await prisma.store.findMany({
      where: {
        status: 'ACTIVE',
        name: { contains: query, mode: 'insensitive' },
        ...(categoryId && { categoryId }),
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true },
        },
        coupons: {
          where: {
            status: 'ACTIVE',
            validUntil: { gte: new Date() },
            deletedAt: null,
          },
          select: { id: true },
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return stores.map((store) => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address,
      distance: 0, // No distance for search results
      activeCoupons: store.coupons.length,
      partnershipStatus: null,
    }));
  }

  /**
   * Calculate distance between two points in meters (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
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
}
