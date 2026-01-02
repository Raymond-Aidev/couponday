import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendSuccess } from '../../common/utils/response.js';
import { PublicStoreService } from './public-store.service.js';
import { optionalStoreAuthGuard } from '../../common/guards/auth.guard.js';

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(5000).default(500),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function publicStoreRoutes(app: FastifyInstance) {
  const publicStoreService = new PublicStoreService();

  // ==========================================
  // Public Store APIs (No auth required)
  // ==========================================

  // Get nearby stores
  app.get('/stores/nearby', {
    preHandler: optionalStoreAuthGuard,
    schema: {
      description: '주변 점포 목록 조회',
      tags: ['Public - Stores'],
      querystring: {
        type: 'object',
        required: ['lat', 'lng'],
        properties: {
          lat: { type: 'number', description: '위도' },
          lng: { type: 'number', description: '경도' },
          radius: { type: 'number', description: '반경(m)', default: 500 },
          categoryId: { type: 'string', format: 'uuid', description: '카테고리 필터' },
          limit: { type: 'number', default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      icon: { type: 'string' },
                    },
                  },
                  address: { type: 'string' },
                  distance: { type: 'number', description: '거리(m)' },
                  activeCoupons: { type: 'number' },
                  partnershipStatus: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const query = nearbyQuerySchema.parse(request.query);
      const myStoreId = request.user?.storeId;

      const stores = await publicStoreService.getNearbyStores(
        query.lat,
        query.lng,
        query.radius,
        {
          categoryId: query.categoryId,
          limit: query.limit,
          excludeStoreId: myStoreId,
          requestorStoreId: myStoreId,
        }
      );

      return sendSuccess(reply, stores);
    } catch (error: any) {
      throw error;
    }
  });

  // Get public store info by ID
  app.get('/stores/:id/public', {
    preHandler: optionalStoreAuthGuard,
    schema: {
      description: '점포 공개 정보 조회',
      tags: ['Public - Stores'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                category: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    icon: { type: 'string' },
                  },
                },
                address: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                operatingHours: { type: 'object' },
                images: { type: 'array', items: { type: 'string' } },
                activeCoupons: { type: 'number' },
                popularItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      price: { type: 'number' },
                      imageUrl: { type: 'string' },
                    },
                  },
                },
                partnershipStatus: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const myStoreId = request.user?.storeId;

    const store = await publicStoreService.getPublicStoreInfo(id, myStoreId);
    return sendSuccess(reply, store);
  });

  // Search stores by name
  app.get('/stores/search', {
    schema: {
      description: '점포 이름 검색',
      tags: ['Public - Stores'],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 2, description: '검색어' },
          categoryId: { type: 'string', format: 'uuid' },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { q, categoryId, limit } = request.query as { q: string; categoryId?: string; limit?: number };

    const stores = await publicStoreService.searchStores(q, { categoryId, limit });
    return sendSuccess(reply, stores);
  });
}
