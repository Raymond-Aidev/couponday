import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { RedemptionService } from './redemption.service.js';

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
}
