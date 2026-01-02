import type { FastifyInstance } from 'fastify';
import { customerAuthGuard, optionalAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { prisma } from '../../database/prisma.js';
import { cache, cacheKeys, cacheTTL } from '../../common/services/cache.service.js';
import { qrService } from '../../common/services/qr.service.js';

export async function customerRoutes(app: FastifyInstance) {
  // Get nearby coupons (public, but location required)
  app.get('/coupons/nearby', {
    schema: {
      description: '주변 쿠폰 조회',
      tags: ['Customer'],
      querystring: {
        type: 'object',
        required: ['lat', 'lng'],
        properties: {
          lat: { type: 'number', description: '위도' },
          lng: { type: 'number', description: '경도' },
          radius: { type: 'number', default: 1000, description: '반경 (미터)' },
          category: { type: 'string', description: '카테고리 ID' },
          limit: { type: 'number', default: 20, description: '조회 개수' },
          offset: { type: 'number', default: 0, description: '오프셋' },
        },
      },
    },
  }, async (request, reply) => {
    const { lat, lng, radius = 1000, category, limit = 20, offset = 0 } = request.query as {
      lat: number;
      lng: number;
      radius?: number;
      category?: string;
      limit?: number;
      offset?: number;
    };

    // Cache key includes location and filters
    const cacheKey = `${cacheKeys.nearbyCoupons(lat, lng, radius)}:${category || 'all'}:${limit}:${offset}`;

    const coupons = await cache.getOrSet(
      cacheKey,
      async () => {
        // Note: For production, use PostGIS ST_DWithin for proper geo queries
        // This is a simplified version
        return prisma.coupon.findMany({
          where: {
            status: 'ACTIVE',
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() },
            deletedAt: null,
            store: {
              status: 'ACTIVE',
              ...(category && { categoryId: category }),
            },
          },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                category: true,
                logoUrl: true,
              },
            },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        });
      },
      { ttl: cacheTTL.SHORT, tags: ['coupons:nearby'] }
    );

    return sendSuccess(reply, coupons, { total: coupons.length, page: Math.floor(offset / limit) + 1, limit });
  });

  // Get coupon details
  app.get('/coupons/:id', {
    schema: {
      description: '쿠폰 상세 조회',
      tags: ['Customer'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const coupon = await cache.getOrSet(
      cacheKeys.couponDetail(id),
      async () => {
        return prisma.coupon.findUnique({
          where: { id },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                description: true,
                address: true,
                latitude: true,
                longitude: true,
                category: true,
                logoUrl: true,
                coverImageUrl: true,
                operatingHours: true,
                phone: true,
              },
            },
            couponItems: {
              include: { item: true },
            },
          },
        });
      },
      { ttl: cacheTTL.MEDIUM, tags: [`coupon:${id}`] }
    );

    if (!coupon) {
      return reply.status(404).send({
        success: false,
        error: { code: 'COUPON_007', message: '쿠폰을 찾을 수 없습니다' },
      });
    }

    return sendSuccess(reply, coupon);
  });

  // Protected routes
  app.register(async (protectedApp) => {
    protectedApp.addHook('preHandler', customerAuthGuard);

    // Save coupon
    protectedApp.post('/coupons/:id/save', {
      schema: {
        description: '쿠폰 저장',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    }, async (request, reply) => {
      const { id: couponId } = request.params as { id: string };
      const customerId = request.user!.sub;

      // Check if coupon exists and is active
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon || coupon.status !== 'ACTIVE') {
        return reply.status(404).send({
          success: false,
          error: { code: 'COUPON_007', message: '쿠폰을 찾을 수 없습니다' },
        });
      }

      // Check if already saved
      const existingSave = await prisma.savedCoupon.findUnique({
        where: {
          customerId_couponId: { customerId, couponId },
        },
      });

      if (existingSave) {
        return reply.status(409).send({
          success: false,
          error: { code: 'COUPON_001', message: '이미 저장한 쿠폰입니다' },
        });
      }

      // Save coupon
      const savedCoupon = await prisma.savedCoupon.create({
        data: {
          customerId,
          couponId,
          expiresAt: coupon.validUntil,
          acquiredChannel: 'app',
        },
      });

      // Update stats
      await prisma.coupon.update({
        where: { id: couponId },
        data: { statsIssued: { increment: 1 } },
      });

      await prisma.customer.update({
        where: { id: customerId },
        data: { statsCouponsSaved: { increment: 1 } },
      });

      return sendSuccess(reply, savedCoupon, 201);
    });

    // Get my saved coupons
    protectedApp.get('/me/coupons', {
      schema: {
        description: '내 쿠폰함 조회',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ACTIVE', 'USED', 'EXPIRED'] },
          },
        },
      },
    }, async (request, reply) => {
      const customerId = request.user!.sub;
      const { status } = request.query as { status?: string };

      const savedCoupons = await prisma.savedCoupon.findMany({
        where: {
          customerId,
          ...(status && { status: status as any }),
        },
        include: {
          coupon: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
        orderBy: { acquiredAt: 'desc' },
      });

      return sendSuccess(reply, savedCoupons);
    });

    // ==========================================
    // Coupon QR Code API (PRD 미구현 항목)
    // ==========================================

    // Get QR code for saved coupon
    protectedApp.get('/me/coupons/:id/qr', {
      schema: {
        description: '저장된 쿠폰 QR 코드 조회',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'SavedCoupon ID' },
          },
        },
      },
    }, async (request, reply) => {
      const customerId = request.user!.sub;
      const { id: savedCouponId } = request.params as { id: string };

      // Find saved coupon with validation
      const savedCoupon = await prisma.savedCoupon.findFirst({
        where: {
          id: savedCouponId,
          customerId,
        },
        include: {
          coupon: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!savedCoupon) {
        return reply.status(404).send({
          success: false,
          error: { code: 'COUPON_007', message: '저장된 쿠폰을 찾을 수 없습니다' },
        });
      }

      // Check if coupon is still active
      if (savedCoupon.status !== 'ACTIVE') {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'COUPON_002',
            message: savedCoupon.status === 'USED'
              ? '이미 사용된 쿠폰입니다'
              : '만료된 쿠폰입니다',
          },
        });
      }

      // Check if coupon is expired
      if (savedCoupon.expiresAt < new Date()) {
        // Update status to expired
        await prisma.savedCoupon.update({
          where: { id: savedCouponId },
          data: { status: 'EXPIRED' },
        });

        return reply.status(400).send({
          success: false,
          error: { code: 'COUPON_003', message: '만료된 쿠폰입니다' },
        });
      }

      // Generate QR code
      const qrExpiresAt = qrService.getQRExpirationTime(savedCoupon.expiresAt);

      const qrResult = await qrService.generateCustomerCouponQR({
        savedCouponId: savedCoupon.id,
        customerId,
        couponId: savedCoupon.couponId,
        storeId: savedCoupon.coupon.storeId,
        expiresAt: qrExpiresAt,
      });

      return sendSuccess(reply, {
        qrCode: qrResult.qrCode,
        qrData: qrResult.qrData,
        qrExpiresAt: qrResult.expiresAt,
        coupon: {
          id: savedCoupon.coupon.id,
          name: savedCoupon.coupon.name,
          description: savedCoupon.coupon.description,
          discountType: savedCoupon.coupon.discountType,
          discountValue: savedCoupon.coupon.discountValue,
          store: savedCoupon.coupon.store,
        },
        savedCoupon: {
          id: savedCoupon.id,
          acquiredAt: savedCoupon.acquiredAt,
          expiresAt: savedCoupon.expiresAt,
        },
      });
    });

    // ==========================================
    // Favorite Stores API
    // ==========================================

    // Get my favorite stores
    protectedApp.get('/me/favorites', {
      schema: {
        description: '즐겨찾기 점포 목록',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
      },
    }, async (request, reply) => {
      const customerId = request.user!.sub;

      const favorites = await prisma.favoriteStore.findMany({
        where: { customerId },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              latitude: true,
              longitude: true,
              logoUrl: true,
              category: { select: { id: true, name: true, icon: true } },
              coupons: {
                where: { status: 'ACTIVE', validUntil: { gte: new Date() } },
                select: { id: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const result = favorites.map(f => ({
        id: f.id,
        addedAt: f.createdAt,
        store: {
          ...f.store,
          activeCoupons: f.store.coupons.length,
          coupons: undefined,
        },
      }));

      return sendSuccess(reply, result);
    });

    // Add to favorites
    protectedApp.post('/stores/:id/favorite', {
      schema: {
        description: '점포 즐겨찾기 추가',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    }, async (request, reply) => {
      const customerId = request.user!.sub;
      const { id: storeId } = request.params as { id: string };

      // Check if store exists
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true, status: true },
      });

      if (!store || store.status !== 'ACTIVE') {
        return reply.status(404).send({
          success: false,
          error: { code: 'STORE_001', message: '점포를 찾을 수 없습니다' },
        });
      }

      // Check if already favorited
      const existing = await prisma.favoriteStore.findUnique({
        where: { customerId_storeId: { customerId, storeId } },
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: { code: 'ALREADY_FAVORITED', message: '이미 즐겨찾기한 점포입니다' },
        });
      }

      const favorite = await prisma.favoriteStore.create({
        data: { customerId, storeId },
      });

      return sendSuccess(reply, { id: favorite.id, storeId, storeName: store.name }, 201);
    });

    // Remove from favorites
    protectedApp.delete('/stores/:id/favorite', {
      schema: {
        description: '점포 즐겨찾기 해제',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    }, async (request, reply) => {
      const customerId = request.user!.sub;
      const { id: storeId } = request.params as { id: string };

      const favorite = await prisma.favoriteStore.findUnique({
        where: { customerId_storeId: { customerId, storeId } },
      });

      if (!favorite) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: '즐겨찾기 목록에 없는 점포입니다' },
        });
      }

      await prisma.favoriteStore.delete({
        where: { id: favorite.id },
      });

      return sendSuccess(reply, { message: '즐겨찾기가 해제되었습니다' });
    });

    // ==========================================
    // Customer Profile API
    // ==========================================

    // Get my profile
    protectedApp.get('/me', {
      schema: {
        description: '내 프로필 조회',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
      },
    }, async (request, reply) => {
      const customerId = request.user!.sub;

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          nickname: true,
          phone: true,
          statsCouponsSaved: true,
          statsCouponsUsed: true,
          statsTotalSavedAmount: true,
          createdAt: true,
          _count: {
            select: {
              favoriteStores: true,
              savedCoupons: true,
            },
          },
        },
      });

      if (!customer) {
        return reply.status(404).send({
          success: false,
          error: { code: 'CUSTOMER_001', message: '고객을 찾을 수 없습니다' },
        });
      }

      return sendSuccess(reply, {
        ...customer,
        isAnonymous: !customer.phone,
        favoriteCount: customer._count.favoriteStores,
        savedCouponCount: customer._count.savedCoupons,
        _count: undefined,
      });
    });

    // Update my profile
    protectedApp.patch('/me', {
      schema: {
        description: '내 프로필 수정',
        tags: ['Customer'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            nickname: { type: 'string', minLength: 2, maxLength: 20 },
          },
        },
      },
    }, async (request, reply) => {
      const customerId = request.user!.sub;
      const { nickname } = request.body as { nickname?: string };

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: { nickname },
        select: {
          id: true,
          nickname: true,
          phone: true,
        },
      });

      return sendSuccess(reply, updated);
    });

    // Token available coupons - moved to cross-coupon.routes.ts
  });
}
