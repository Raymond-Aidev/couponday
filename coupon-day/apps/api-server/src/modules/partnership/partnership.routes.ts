import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { PartnershipService } from './partnership.service.js';

const requestPartnershipSchema = z.object({
  targetStoreId: z.string().uuid(),
});

const respondPartnershipSchema = z.object({
  accept: z.boolean(),
});

export async function partnershipRoutes(app: FastifyInstance) {
  const partnershipService = new PartnershipService();

  // Get AI recommended partners
  app.get('/store/me/partnerships/recommendations', {
    preHandler: storeAuthGuard,
    schema: {
      description: 'AI 파트너 추천 조회',
      tags: ['Partnership'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['provider', 'distributor'], default: 'provider' },
          limit: { type: 'number', default: 10 },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { role, limit } = request.query as { role?: 'provider' | 'distributor'; limit?: number };

    const recommendations = await partnershipService.getPartnerRecommendations(
      storeId,
      role ?? 'provider',
      limit ?? 10
    );

    return sendSuccess(reply, recommendations);
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

    const partnerships = await partnershipService.getPartnerships(storeId, status);
    return sendSuccess(reply, partnerships);
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
    return sendSuccess(reply, partnership);
  });
}
