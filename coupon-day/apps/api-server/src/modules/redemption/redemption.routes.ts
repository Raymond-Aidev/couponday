import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { RedemptionService } from './redemption.service.js';
import { qrService } from '../../common/services/qr.service.js';
import { prisma } from '../../database/prisma.js';

const redemptionSchema = z.object({
  savedCouponId: z.string().uuid().optional(),
  couponId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  orderAmount: z.number().int().positive().optional(),
  orderItems: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().int().nonnegative(),
  })).optional(),
}).refine(
  (data) => data.savedCouponId || data.couponId,
  { message: 'savedCouponId 또는 couponId가 필요합니다' }
);

export async function redemptionRoutes(app: FastifyInstance) {
  const redemptionService = new RedemptionService();

  // Process coupon redemption (store endpoint)
  app.post('/redemptions', {
    preHandler: storeAuthGuard,
    schema: {
      description: '쿠폰 사용 처리',
      tags: ['Redemption'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          savedCouponId: { type: 'string', format: 'uuid', description: '저장된 쿠폰 ID' },
          couponId: { type: 'string', format: 'uuid', description: '쿠폰 ID (직접 사용 시)' },
          customerId: { type: 'string', format: 'uuid', description: '고객 ID (선택)' },
          orderAmount: { type: 'number', description: '주문 금액' },
          orderItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemId: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const input = redemptionSchema.parse(request.body);
    const result = await redemptionService.redeemCoupon(storeId, input);
    return sendSuccess(reply, result, 201);
  });

  // Get store redemption history
  app.get('/store/me/redemptions', {
    preHandler: storeAuthGuard,
    schema: {
      description: '쿠폰 사용 내역 조회',
      tags: ['Store - Redemption'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          couponId: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { couponId, startDate, endDate, limit, offset } = request.query as {
      couponId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    };

    const result = await redemptionService.getStoreRedemptions(storeId, {
      couponId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });

    return sendSuccess(reply, result.redemptions, {
      total: result.total,
      page: Math.floor((offset ?? 0) / (limit ?? 50)) + 1,
      limit: limit ?? 50,
    });
  });

  // ==========================================
  // QR Code Scan API (PRD 미구현 항목)
  // ==========================================

  // Scan and verify customer QR code
  app.post('/store/me/coupons/scan', {
    preHandler: storeAuthGuard,
    schema: {
      description: '고객 쿠폰 QR 코드 스캔 및 검증',
      tags: ['Store - Redemption'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['qrData'],
        properties: {
          qrData: { type: 'string', description: 'QR 코드 데이터' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { qrData } = request.body as { qrData: string };

    // Verify QR code
    const verifyResult = qrService.verifyQRData(qrData);

    if (!verifyResult.valid || !verifyResult.payload) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'QR_001',
          message: verifyResult.error || 'QR 코드 검증에 실패했습니다',
        },
      });
    }

    const payload = verifyResult.payload;

    // Verify this coupon belongs to this store
    if (payload.storeId !== storeId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'QR_002',
          message: '이 매장에서 사용할 수 없는 쿠폰입니다',
        },
      });
    }

    // Get saved coupon details
    const savedCoupon = await prisma.savedCoupon.findUnique({
      where: { id: payload.savedCouponId },
      include: {
        coupon: {
          include: {
            store: {
              select: { id: true, name: true },
            },
            couponItems: {
              include: { item: true },
            },
          },
        },
        customer: {
          select: { id: true, nickname: true, phone: true },
        },
      },
    });

    if (!savedCoupon) {
      return reply.status(404).send({
        success: false,
        error: { code: 'QR_003', message: '쿠폰을 찾을 수 없습니다' },
      });
    }

    // Verify coupon status
    if (savedCoupon.status !== 'ACTIVE') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'QR_004',
          message: savedCoupon.status === 'USED'
            ? '이미 사용된 쿠폰입니다'
            : '만료된 쿠폰입니다',
        },
      });
    }

    // Verify coupon hasn't expired
    if (savedCoupon.expiresAt < new Date()) {
      return reply.status(400).send({
        success: false,
        error: { code: 'QR_005', message: '만료된 쿠폰입니다' },
      });
    }

    // Return verification result (coupon is valid and ready for use)
    return sendSuccess(reply, {
      valid: true,
      savedCoupon: {
        id: savedCoupon.id,
        acquiredAt: savedCoupon.acquiredAt,
        expiresAt: savedCoupon.expiresAt,
      },
      coupon: {
        id: savedCoupon.coupon.id,
        name: savedCoupon.coupon.name,
        description: savedCoupon.coupon.description,
        discountType: savedCoupon.coupon.discountType,
        discountValue: savedCoupon.coupon.discountValue,
        discountCondition: savedCoupon.coupon.discountCondition,
        targetItems: savedCoupon.coupon.couponItems.map((ci) => ({
          id: ci.item.id,
          name: ci.item.name,
          price: ci.item.price,
        })),
      },
      customer: savedCoupon.customer
        ? {
            id: savedCoupon.customer.id,
            nickname: savedCoupon.customer.nickname,
            phone: savedCoupon.customer.phone
              ? `***-****-${savedCoupon.customer.phone.slice(-4)}`
              : null,
          }
        : null,
      message: '유효한 쿠폰입니다. 사용 처리를 진행하세요.',
    });
  });

  // Use coupon after QR scan (complete redemption)
  app.post('/store/me/coupons/scan/use', {
    preHandler: storeAuthGuard,
    schema: {
      description: 'QR 스캔 후 쿠폰 사용 처리',
      tags: ['Store - Redemption'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['savedCouponId'],
        properties: {
          savedCouponId: { type: 'string', format: 'uuid', description: '저장된 쿠폰 ID' },
          orderAmount: { type: 'number', description: '주문 금액' },
          orderItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemId: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { savedCouponId, orderAmount, orderItems } = request.body as {
      savedCouponId: string;
      orderAmount?: number;
      orderItems?: Array<{ itemId: string; quantity: number; price: number }>;
    };

    // Use the existing redemption service
    const result = await redemptionService.redeemCoupon(storeId, {
      savedCouponId,
      orderAmount,
      orderItems,
    });

    return sendSuccess(reply, result, 201);
  });
}
