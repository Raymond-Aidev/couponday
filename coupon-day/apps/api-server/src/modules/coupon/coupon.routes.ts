import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { prisma } from '../../database/prisma.js';
import { checkCouponAvailability } from './services/coupon-availability.service.js';
import {
  calculateCouponPerformance,
  generateInsights,
} from './services/coupon-performance.service.js';
import { DiscountCalculatorService, DiscountCondition, DiscountType } from './discount-calculator.service.js';

const calculateDiscountSchema = z.object({
  couponId: z.string().uuid(),
  orderItems: z.array(z.object({
    itemId: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
  })),
  orderTotal: z.number().positive(),
});

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

  // ==========================================
  // Discount Calculation API
  // ==========================================

  const discountCalculator = new DiscountCalculatorService();

  // Calculate discount for order
  app.post('/coupons/calculate-discount', {
    schema: {
      description: '쿠폰 할인 금액 계산 (BOGO, BUNDLE, FREEBIE, CONDITIONAL 지원)',
      tags: ['Coupons'],
      body: {
        type: 'object',
        required: ['couponId', 'orderItems', 'orderTotal'],
        properties: {
          couponId: { type: 'string', format: 'uuid' },
          orderItems: {
            type: 'array',
            items: {
              type: 'object',
              required: ['itemId', 'name', 'price', 'quantity'],
              properties: {
                itemId: { type: 'string' },
                name: { type: 'string' },
                price: { type: 'number' },
                quantity: { type: 'number' },
              },
            },
          },
          orderTotal: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const input = calculateDiscountSchema.parse(request.body);

    const coupon = await prisma.coupon.findUnique({
      where: { id: input.couponId },
      include: {
        store: { select: { id: true, name: true } },
      },
    });

    if (!coupon) {
      return reply.status(404).send({
        success: false,
        error: { code: 'COUPON_007', message: '쿠폰을 찾을 수 없습니다' },
      });
    }

    // Check if coupon is valid
    const now = new Date();
    if (coupon.status !== 'ACTIVE' || coupon.validFrom > now || coupon.validUntil < now) {
      return reply.status(400).send({
        success: false,
        error: { code: 'COUPON_EXPIRED', message: '쿠폰이 유효하지 않습니다' },
      });
    }

    const result = discountCalculator.calculateDiscount(
      coupon.discountType as DiscountType,
      coupon.discountValue,
      coupon.discountCondition as DiscountCondition | null,
      input.orderItems,
      input.orderTotal
    );

    return sendSuccess(reply, {
      coupon: {
        id: coupon.id,
        name: coupon.name,
        discountType: coupon.discountType,
        store: coupon.store,
      },
      calculation: result,
      finalTotal: Math.max(0, input.orderTotal - result.discountAmount),
    });
  });

  // Validate discount condition
  app.post('/store/me/coupons/validate-condition', {
    preHandler: storeAuthGuard,
    schema: {
      description: '할인 조건 유효성 검증',
      tags: ['Store - Coupons'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['discountType'],
        properties: {
          discountType: { type: 'string', enum: ['FIXED', 'PERCENTAGE', 'BOGO', 'BUNDLE', 'FREEBIE', 'CONDITIONAL'] },
          discountCondition: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    const { discountType, discountCondition } = request.body as {
      discountType: DiscountType;
      discountCondition?: DiscountCondition;
    };

    const validation = discountCalculator.validateCondition(discountType, discountCondition ?? null);

    return sendSuccess(reply, validation);
  });
}
