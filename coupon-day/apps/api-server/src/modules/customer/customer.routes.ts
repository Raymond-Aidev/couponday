import type { FastifyInstance } from 'fastify';
import { customerAuthGuard, optionalAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { prisma } from '../../database/prisma.js';

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

    // Note: For production, use PostGIS ST_DWithin for proper geo queries
    // This is a simplified version
    const coupons = await prisma.coupon.findMany({
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

    const coupon = await prisma.coupon.findUnique({
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

    // Token available coupons - moved to cross-coupon.routes.ts
  });
}
