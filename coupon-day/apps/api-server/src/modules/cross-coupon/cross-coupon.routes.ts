import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storeAuthGuard, customerAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { CrossCouponService } from './cross-coupon.service.js';
import { MealTokenService } from './meal-token.service.js';
import { SettlementService } from './settlement.service.js';

const createCrossCouponSchema = z.object({
  partnershipId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  discountType: z.enum(['FIXED', 'PERCENTAGE']),
  discountValue: z.number().int().positive(),
  minOrderAmount: z.number().int().positive().optional(),
  redemptionWindow: z.enum(['same_day', 'next_day', 'within_week']),
  availableTimeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  availableTimeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dailyLimit: z.number().int().positive().optional(),
});

const updateCrossCouponSchema = createCrossCouponSchema.partial().omit({ partnershipId: true });

const issueTokenSchema = z.object({
  partnershipId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  orderAmount: z.number().int().positive().optional(),
});

const selectCouponSchema = z.object({
  crossCouponId: z.string().uuid(),
});

const verifyTokenSchema = z.object({
  orderAmount: z.number().int().positive().optional(),
});

export async function crossCouponRoutes(app: FastifyInstance) {
  const crossCouponService = new CrossCouponService();
  const mealTokenService = new MealTokenService();
  const settlementService = new SettlementService();

  // ==========================================
  // Store API (Cross Coupon Management)
  // ==========================================

  // Get my cross coupons
  app.get('/store/me/cross-coupons', {
    preHandler: storeAuthGuard,
    schema: {
      description: '내 크로스 쿠폰 목록 조회',
      tags: ['Cross Coupon'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const crossCoupons = await crossCouponService.getCrossCoupons(storeId);
    return sendSuccess(reply, crossCoupons);
  });

  // Get cross coupon summary stats
  app.get('/store/me/cross-coupons/summary', {
    preHandler: storeAuthGuard,
    schema: {
      description: '크로스 쿠폰 전체 통계 요약',
      tags: ['Cross Coupon'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const summary = await crossCouponService.getStoreCrossCouponSummary(storeId);
    return sendSuccess(reply, summary);
  });

  // Get individual cross coupon stats
  app.get('/store/me/cross-coupons/:id/stats', {
    preHandler: storeAuthGuard,
    schema: {
      description: '크로스 쿠폰 상세 통계',
      tags: ['Cross Coupon'],
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
    const { id } = request.params as { id: string };
    const stats = await crossCouponService.getCrossCouponStats(storeId, id);
    return sendSuccess(reply, stats);
  });

  // Create cross coupon
  app.post('/store/me/cross-coupons', {
    preHandler: storeAuthGuard,
    schema: {
      description: '크로스 쿠폰 생성 (Provider 점포만)',
      tags: ['Cross Coupon'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['partnershipId', 'name', 'discountType', 'discountValue', 'redemptionWindow'],
        properties: {
          partnershipId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          discountType: { type: 'string', enum: ['FIXED', 'PERCENTAGE'] },
          discountValue: { type: 'number' },
          minOrderAmount: { type: 'number' },
          redemptionWindow: { type: 'string', enum: ['same_day', 'next_day', 'within_week'] },
          availableTimeStart: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          availableTimeEnd: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          dailyLimit: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const input = createCrossCouponSchema.parse(request.body);
    const crossCoupon = await crossCouponService.createCrossCoupon(storeId, input);
    return sendSuccess(reply, crossCoupon, 201);
  });

  // Update cross coupon
  app.patch('/store/me/cross-coupons/:id', {
    preHandler: storeAuthGuard,
    schema: {
      description: '크로스 쿠폰 수정',
      tags: ['Cross Coupon'],
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
    const { id } = request.params as { id: string };
    const input = updateCrossCouponSchema.parse(request.body);
    const crossCoupon = await crossCouponService.updateCrossCoupon(storeId, id, input);
    return sendSuccess(reply, crossCoupon);
  });

  // Delete cross coupon
  app.delete('/store/me/cross-coupons/:id', {
    preHandler: storeAuthGuard,
    schema: {
      description: '크로스 쿠폰 삭제 (비활성화)',
      tags: ['Cross Coupon'],
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
    const { id } = request.params as { id: string };
    await crossCouponService.deleteCrossCoupon(storeId, id);
    return sendSuccess(reply, { message: '크로스 쿠폰이 비활성화되었습니다' });
  });

  // ==========================================
  // Store API (Meal Token Issuance)
  // ==========================================

  // Issue meal token (distributor store)
  app.post('/store/me/tokens', {
    preHandler: storeAuthGuard,
    schema: {
      description: '식사 토큰 발급 (Distributor 점포)',
      tags: ['Meal Token'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['partnershipId'],
        properties: {
          partnershipId: { type: 'string', format: 'uuid' },
          customerId: { type: 'string', format: 'uuid' },
          orderAmount: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const input = issueTokenSchema.parse(request.body);
    const result = await mealTokenService.issueMealToken(storeId, input);
    return sendSuccess(reply, result, 201);
  });

  // Verify and use token (provider store)
  app.post('/store/me/tokens/:code/verify', {
    preHandler: storeAuthGuard,
    schema: {
      description: '식사 토큰 검증 및 사용 (Provider 점포)',
      tags: ['Meal Token'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          orderAmount: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { code } = request.params as { code: string };
    const input = verifyTokenSchema.parse(request.body);
    const result = await mealTokenService.verifyAndUseToken(storeId, code, input.orderAmount);
    return sendSuccess(reply, result);
  });

  // ==========================================
  // Customer API (Token & Coupon Selection)
  // ==========================================

  // Get available coupons for token
  app.get('/customer/tokens/:code/available-coupons', {
    schema: {
      description: '토큰으로 선택 가능한 크로스 쿠폰 조회',
      tags: ['Customer - Cross Coupon'],
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const coupons = await mealTokenService.getAvailableCoupons(code);
    return sendSuccess(reply, coupons);
  });

  // Select coupon from token
  app.post('/customer/tokens/:code/select', {
    schema: {
      description: '토큰으로 크로스 쿠폰 선택',
      tags: ['Customer - Cross Coupon'],
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['crossCouponId'],
        properties: {
          crossCouponId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const input = selectCouponSchema.parse(request.body);
    // Get customer ID if authenticated
    const customerId = (request as any).user?.customerId;
    const result = await mealTokenService.selectCoupon(code, input.crossCouponId, customerId);
    return sendSuccess(reply, result);
  });

  // Get token info
  app.get('/customer/tokens/:code', {
    schema: {
      description: '토큰 정보 조회',
      tags: ['Customer - Cross Coupon'],
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const token = await mealTokenService.getTokenByCode(code);
    return sendSuccess(reply, token);
  });

  // ==========================================
  // Customer API (My Tokens - PRD 미구현 항목)
  // ==========================================

  // Get my tokens list
  app.get('/customer/me/tokens', {
    preHandler: customerAuthGuard,
    schema: {
      description: '내 토큰 목록 조회',
      tags: ['Customer - Cross Coupon'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ISSUED', 'SELECTED', 'REDEEMED', 'EXPIRED'],
            description: '토큰 상태 필터'
          },
          limit: { type: 'number', default: 20, description: '조회 개수' },
          offset: { type: 'number', default: 0, description: '오프셋' },
        },
      },
    },
  }, async (request, reply) => {
    const customerId = request.user!.sub;
    const { status, limit = 20, offset = 0 } = request.query as {
      status?: 'ISSUED' | 'SELECTED' | 'REDEEMED' | 'EXPIRED';
      limit?: number;
      offset?: number;
    };

    const result = await mealTokenService.getCustomerTokens(customerId, { status, limit, offset });
    return sendSuccess(reply, result.tokens, {
      total: result.total,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  });

  // Get my token by ID
  app.get('/customer/me/tokens/:id', {
    preHandler: customerAuthGuard,
    schema: {
      description: '내 토큰 상세 조회',
      tags: ['Customer - Cross Coupon'],
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
    const { id } = request.params as { id: string };

    const token = await mealTokenService.getCustomerTokenById(customerId, id);
    return sendSuccess(reply, token);
  });

  // ==========================================
  // Settlement API
  // ==========================================

  // Get settlements for store
  app.get('/store/me/settlements', {
    preHandler: storeAuthGuard,
    schema: {
      description: '정산 내역 조회',
      tags: ['Settlement'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          year: { type: 'number' },
          partnershipId: { type: 'string', format: 'uuid' },
          limit: { type: 'number', default: 12 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { year, partnershipId, limit, offset } = request.query as {
      year?: number;
      partnershipId?: string;
      limit?: number;
      offset?: number;
    };

    const result = await settlementService.getStoreSettlements(storeId, {
      year,
      partnershipId,
      limit,
      offset,
    });

    return sendSuccess(reply, result.settlements, {
      total: result.total,
      page: Math.floor((offset ?? 0) / (limit ?? 12)) + 1,
      limit: limit ?? 12,
    });
  });

  // Get settlement details for partnership
  app.get('/store/me/partnerships/:id/settlements', {
    preHandler: storeAuthGuard,
    schema: {
      description: '파트너십 정산 상세 조회',
      tags: ['Settlement'],
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
          year: { type: 'number' },
          month: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { year, month } = request.query as { year?: number; month?: number };

    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;

    const settlement = await settlementService.calculateSettlement(
      id,
      targetYear,
      targetMonth
    );

    return sendSuccess(reply, settlement);
  });
}
