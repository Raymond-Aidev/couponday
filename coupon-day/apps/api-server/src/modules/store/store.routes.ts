import type { FastifyInstance } from 'fastify';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { StoreService } from './store.service.js';
import {
  storeUpdateSchema,
  itemCreateSchema,
  itemUpdateSchema,
  couponCreateSchema,
  couponUpdateSchema,
  couponStatusUpdateSchema,
} from './store.schema.js';

export async function storeRoutes(app: FastifyInstance) {
  const storeService = new StoreService();

  // All store routes require authentication
  app.addHook('preHandler', storeAuthGuard);

  // ==========================================
  // Store Management
  // ==========================================

  // Get my store info
  app.get('/me', {
    schema: {
      description: '내 점포 정보 조회',
      tags: ['Store'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const store = await storeService.getStore(storeId);
    return sendSuccess(reply, store);
  });

  // Update my store info
  app.patch('/me', {
    schema: {
      description: '점포 정보 수정',
      tags: ['Store'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          address: { type: 'string' },
          addressDetail: { type: 'string' },
          operatingHours: { type: 'object' },
          hasParking: { type: 'boolean' },
          hasDelivery: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const input = storeUpdateSchema.parse(request.body);
    const store = await storeService.updateStore(storeId, input);
    return sendSuccess(reply, store);
  });

  // Get dashboard data
  app.get('/me/dashboard', {
    schema: {
      description: '대시보드 데이터 조회',
      tags: ['Store'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const dashboard = await storeService.getDashboard(storeId);
    return sendSuccess(reply, dashboard);
  });

  // ==========================================
  // Item (Menu) Management
  // ==========================================

  // Get all items
  app.get('/me/items', {
    schema: {
      description: '메뉴 목록 조회',
      tags: ['Store - Items'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const items = await storeService.getItems(storeId);
    return sendSuccess(reply, items);
  });

  // Get single item
  app.get('/me/items/:id', {
    schema: {
      description: '메뉴 상세 조회',
      tags: ['Store - Items'],
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
    const item = await storeService.getItem(storeId, id);
    return sendSuccess(reply, item);
  });

  // Create item
  app.post('/me/items', {
    schema: {
      description: '메뉴 추가',
      tags: ['Store - Items'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'number' },
          cost: { type: 'number' },
          imageUrl: { type: 'string' },
          isAvailable: { type: 'boolean' },
          isPopular: { type: 'boolean' },
          displayOrder: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const input = itemCreateSchema.parse(request.body);
    const item = await storeService.createItem(storeId, input);
    return sendSuccess(reply, item, 201);
  });

  // Update item
  app.patch('/me/items/:id', {
    schema: {
      description: '메뉴 수정',
      tags: ['Store - Items'],
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
    const input = itemUpdateSchema.parse(request.body);
    const item = await storeService.updateItem(storeId, id, input);
    return sendSuccess(reply, item);
  });

  // Delete item
  app.delete('/me/items/:id', {
    schema: {
      description: '메뉴 삭제',
      tags: ['Store - Items'],
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
    await storeService.deleteItem(storeId, id);
    return sendSuccess(reply, { message: '메뉴가 삭제되었습니다' });
  });

  // ==========================================
  // Coupon Management
  // ==========================================

  // Get coupon recommendations (must be before /me/coupons/:id to avoid route collision)
  app.get('/me/coupons/recommendations', {
    schema: {
      description: 'AI 쿠폰 추천 조회',
      tags: ['Store - Coupons'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const recommendations = await storeService.getCouponRecommendations(storeId);
    return sendSuccess(reply, recommendations);
  });

  // Get all coupons
  app.get('/me/coupons', {
    schema: {
      description: '쿠폰 목록 조회',
      tags: ['Store - Coupons'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED'] },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { status } = request.query as { status?: string };
    const coupons = await storeService.getCoupons(storeId, status);
    return sendSuccess(reply, coupons);
  });

  // Get single coupon
  app.get('/me/coupons/:id', {
    schema: {
      description: '쿠폰 상세 조회',
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
    const { id } = request.params as { id: string };
    const coupon = await storeService.getCoupon(storeId, id);
    return sendSuccess(reply, coupon);
  });

  // Create coupon
  app.post('/me/coupons', {
    schema: {
      description: '쿠폰 생성',
      tags: ['Store - Coupons'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'discountType', 'validFrom', 'validUntil'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          discountType: { type: 'string', enum: ['FIXED', 'PERCENTAGE', 'BOGO', 'BUNDLE', 'FREEBIE', 'CONDITIONAL'] },
          discountValue: { type: 'number' },
          targetScope: { type: 'string', enum: ['ALL', 'CATEGORY', 'SPECIFIC'] },
          targetItemIds: { type: 'array', items: { type: 'string' } },
          validFrom: { type: 'string', format: 'date-time' },
          validUntil: { type: 'string', format: 'date-time' },
          availableDays: { type: 'array', items: { type: 'number' } },
          availableTimeStart: { type: 'string' },
          availableTimeEnd: { type: 'string' },
          totalQuantity: { type: 'number' },
          dailyLimit: { type: 'number' },
          perUserLimit: { type: 'number' },
          status: { type: 'string', enum: ['DRAFT', 'SCHEDULED', 'ACTIVE'] },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const input = couponCreateSchema.parse(request.body);
    const coupon = await storeService.createCoupon(storeId, input);
    return sendSuccess(reply, coupon, 201);
  });

  // Update coupon
  app.patch('/me/coupons/:id', {
    schema: {
      description: '쿠폰 수정',
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
    const { id } = request.params as { id: string };
    const input = couponUpdateSchema.parse(request.body);
    const coupon = await storeService.updateCoupon(storeId, id, input);
    return sendSuccess(reply, coupon);
  });

  // Update coupon status
  app.patch('/me/coupons/:id/status', {
    schema: {
      description: '쿠폰 상태 변경',
      tags: ['Store - Coupons'],
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
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED'] },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { id } = request.params as { id: string };
    const input = couponStatusUpdateSchema.parse(request.body);
    const coupon = await storeService.updateCouponStatus(storeId, id, input);
    return sendSuccess(reply, coupon);
  });

  // Delete coupon
  app.delete('/me/coupons/:id', {
    schema: {
      description: '쿠폰 삭제',
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
    const { id } = request.params as { id: string };
    await storeService.deleteCoupon(storeId, id);
    return sendSuccess(reply, { message: '쿠폰이 삭제되었습니다' });
  });

  // ==========================================
  // Partnerships - moved to partnership.routes.ts
  // ==========================================
}
