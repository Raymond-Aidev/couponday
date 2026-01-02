import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { PartnershipService, MatchingWeights, DEFAULT_WEIGHTS } from './partnership.service.js';
import { cache, cacheKeys, cacheTTL } from '../../common/services/cache.service.js';

const requestPartnershipSchema = z.object({
  targetStoreId: z.string().uuid(),
});

const respondPartnershipSchema = z.object({
  accept: z.boolean(),
});

const matchingWeightsSchema = z.object({
  categoryTransition: z.number().int().min(0).max(100).optional(),
  distance: z.number().int().min(0).max(100).optional(),
  priceSimilarity: z.number().int().min(0).max(100).optional(),
  peakTimeAlignment: z.number().int().min(0).max(100).optional(),
});

export async function partnershipRoutes(app: FastifyInstance) {
  const partnershipService = new PartnershipService();

  // Get AI recommended partners with optional custom weights
  app.get('/store/me/partnerships/recommendations', {
    preHandler: storeAuthGuard,
    schema: {
      description: 'AI 파트너 추천 조회 (가중치 커스터마이징 가능)',
      tags: ['Partnership'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['provider', 'distributor'], default: 'provider' },
          limit: { type: 'number', default: 10 },
          // Custom weights (optional)
          weightCategoryTransition: { type: 'number', minimum: 0, maximum: 100 },
          weightDistance: { type: 'number', minimum: 0, maximum: 100 },
          weightPriceSimilarity: { type: 'number', minimum: 0, maximum: 100 },
          weightPeakTimeAlignment: { type: 'number', minimum: 0, maximum: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const {
      role,
      limit,
      weightCategoryTransition,
      weightDistance,
      weightPriceSimilarity,
      weightPeakTimeAlignment,
    } = request.query as {
      role?: 'provider' | 'distributor';
      limit?: number;
      weightCategoryTransition?: number;
      weightDistance?: number;
      weightPriceSimilarity?: number;
      weightPeakTimeAlignment?: number;
    };

    // Build custom weights if any provided
    const customWeights: Partial<MatchingWeights> | undefined =
      weightCategoryTransition !== undefined ||
      weightDistance !== undefined ||
      weightPriceSimilarity !== undefined ||
      weightPeakTimeAlignment !== undefined
        ? {
            ...(weightCategoryTransition !== undefined && { categoryTransition: weightCategoryTransition }),
            ...(weightDistance !== undefined && { distance: weightDistance }),
            ...(weightPriceSimilarity !== undefined && { priceSimilarity: weightPriceSimilarity }),
            ...(weightPeakTimeAlignment !== undefined && { peakTimeAlignment: weightPeakTimeAlignment }),
          }
        : undefined;

    // Only cache when using default weights (custom weights = no cache)
    if (!customWeights) {
      const cached = await cache.get<any>(cacheKeys.partnerRecommendations(storeId));
      if (cached) {
        return sendSuccess(reply, cached);
      }
    }

    const recommendations = await partnershipService.getPartnerRecommendations(
      storeId,
      role ?? 'provider',
      limit ?? 10,
      customWeights
    );

    // Cache recommendations for 30 minutes (only for default weights)
    if (!customWeights) {
      await cache.set(cacheKeys.partnerRecommendations(storeId), recommendations, {
        ttl: cacheTTL.LONG,
        tags: [`store:${storeId}:partnerships`],
      });
    }

    return sendSuccess(reply, recommendations);
  });

  // Get default matching weights
  app.get('/store/me/partnerships/weights', {
    preHandler: storeAuthGuard,
    schema: {
      description: '파트너 매칭 가중치 조회',
      tags: ['Partnership'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    return sendSuccess(reply, {
      weights: partnershipService.getWeights(),
      defaults: DEFAULT_WEIGHTS,
      description: {
        categoryTransition: '카테고리 전환율 가중치 (기본: 40)',
        distance: '거리 가중치 (기본: 20)',
        priceSimilarity: '가격대 유사성 가중치 (기본: 20)',
        peakTimeAlignment: '피크타임 일치 가중치 (기본: 20)',
      },
    });
  });

  // Update matching weights
  app.patch('/store/me/partnerships/weights', {
    preHandler: storeAuthGuard,
    schema: {
      description: '파트너 매칭 가중치 수정 (합계 100)',
      tags: ['Partnership'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          categoryTransition: { type: 'number', minimum: 0, maximum: 100 },
          distance: { type: 'number', minimum: 0, maximum: 100 },
          priceSimilarity: { type: 'number', minimum: 0, maximum: 100 },
          peakTimeAlignment: { type: 'number', minimum: 0, maximum: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const weights = matchingWeightsSchema.parse(request.body);
    partnershipService.setWeights(weights);

    return sendSuccess(reply, {
      message: '가중치가 업데이트되었습니다',
      weights: partnershipService.getWeights(),
    });
  });

  // Get my partnerships
  app.get('/store/me/partnerships', {
    preHandler: storeAuthGuard,
    schema: {
      description: '내 파트너십 목록 조회',
      tags: ['Partnership'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'TERMINATED'] },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { status } = request.query as { status?: string };

    const cacheKey = `${cacheKeys.storePartnerships(storeId)}:${status || 'all'}`;
    const partnerships = await cache.getOrSet(
      cacheKey,
      () => partnershipService.getPartnerships(storeId, status),
      { ttl: cacheTTL.MEDIUM, tags: [`store:${storeId}:partnerships`] }
    );

    return sendSuccess(reply, partnerships);
  });

  // Get partnership by ID
  app.get('/store/me/partnerships/:id', {
    preHandler: storeAuthGuard,
    schema: {
      description: '파트너십 상세 조회',
      tags: ['Partnership'],
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

    const partnership = await partnershipService.getPartnershipById(id, storeId);
    return sendSuccess(reply, partnership);
  });

  // Request partnership
  app.post('/store/me/partnerships/requests', {
    preHandler: storeAuthGuard,
    schema: {
      description: '파트너십 요청',
      tags: ['Partnership'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['targetStoreId'],
        properties: {
          targetStoreId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const input = requestPartnershipSchema.parse(request.body);

    const partnership = await partnershipService.requestPartnership(storeId, input.targetStoreId);

    // Invalidate caches for both stores
    await cache.invalidateByTag(`store:${storeId}:partnerships`);
    await cache.invalidateByTag(`store:${input.targetStoreId}:partnerships`);

    return sendSuccess(reply, partnership, 201);
  });

  // Respond to partnership request
  app.patch('/store/me/partnerships/requests/:id', {
    preHandler: storeAuthGuard,
    schema: {
      description: '파트너십 요청 응답 (수락/거절)',
      tags: ['Partnership'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['accept'],
        properties: {
          accept: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { id } = request.params as { id: string };
    const input = respondPartnershipSchema.parse(request.body);

    const partnership = await partnershipService.respondToPartnership(id, storeId, input.accept);

    // Invalidate caches for both stores
    await cache.invalidateByTag(`store:${partnership.distributorStoreId}:partnerships`);
    await cache.invalidateByTag(`store:${partnership.providerStoreId}:partnerships`);

    return sendSuccess(reply, partnership);
  });
}
