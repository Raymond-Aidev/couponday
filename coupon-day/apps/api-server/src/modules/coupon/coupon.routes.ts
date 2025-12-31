import type { FastifyInstance } from 'fastify';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { prisma } from '../../database/prisma.js';
import { checkCouponAvailability } from './services/coupon-availability.service.js';
import {
  calculateCouponPerformance,
  generateInsights,
} from './services/coupon-performance.service.js';

export async function couponRoutes(app: FastifyInstance) {
  // Performance analysis endpoint (store auth required)
  app.get('/store/me/coupons/:id/performance', {
    preHandler: storeAuthGuard,
    schema: {
      description: '쿠폰 성과 분석',
      tags: ['Store - Coupons'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { id: couponId } = request.params as { id: string };
    const { startDate, endDate } = request.query as {
      startDate?: string;
      endDate?: string;
    };

    // Verify coupon belongs to store
    const coupon = await prisma.coupon.findFirst({
      where: { id: couponId, storeId },
    });

    if (!coupon) {
      return reply.status(404).send({
        success: false,
        error: { code: 'COUPON_007', message: '쿠폰을 찾을 수 없습니다' },
      });
    }

    const analysisStart = startDate ? new Date(startDate) : undefined;
    const analysisEnd = endDate ? new Date(endDate) : undefined;

    const performance = await calculateCouponPerformance(couponId, analysisStart, analysisEnd);
    const insights = generateInsights(performance);

    return sendSuccess(reply, { ...performance, insights });
  });

  // Check coupon availability (public or authenticated)
  app.get('/coupons/:id/availability', {
    schema: {
      description: '쿠폰 사용 가능 여부 확인',
      tags: ['Coupons'],
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

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      return reply.status(404).send({
        success: false,
        error: { code: 'COUPON_007', message: '쿠폰을 찾을 수 없습니다' },
      });
    }

    // Get customer ID from JWT if authenticated
    let customerId: string | undefined;
    try {
      await request.jwtVerify();
      customerId = request.user?.sub;
    } catch {
      // Not authenticated, that's ok
    }

    const availability = await checkCouponAvailability(coupon, customerId);
    return sendSuccess(reply, availability);
  });

  // QR code generation (store auth required)
  app.get('/store/me/coupons/:id/qr', {
    preHandler: storeAuthGuard,
    schema: {
      description: '쿠폰 QR 코드 조회',
      tags: ['Store - Coupons'],
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
    const storeId = request.user!.storeId!;
    const { id: couponId } = request.params as { id: string };

    // Verify coupon belongs to store
    const coupon = await prisma.coupon.findFirst({
      where: { id: couponId, storeId },
      include: { store: { select: { name: true } } },
    });

    if (!coupon) {
      return reply.status(404).send({
        success: false,
        error: { code: 'COUPON_007', message: '쿠폰을 찾을 수 없습니다' },
      });
    }

    // Generate QR code data
    const qrData = {
      type: 'coupon',
      couponId: coupon.id,
      storeName: coupon.store.name,
      couponName: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      validUntil: coupon.validUntil.toISOString(),
    };

    // In production, you would generate actual QR code image here
    // using a library like 'qrcode'
    return sendSuccess(reply, {
      qrData: JSON.stringify(qrData),
      qrUrl: `couponday://coupon/${coupon.id}`,
      // In production: qrImage: base64EncodedQRImage
    });
  });
}
