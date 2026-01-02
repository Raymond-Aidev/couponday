import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { customerAuthGuard, storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { notificationService } from './notification.service.js';
import { fcmService } from '../../common/services/fcm.service.js';

const registerDeviceSchema = z.object({
  fcmToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  deviceModel: z.string().optional(),
});

export async function notificationRoutes(app: FastifyInstance) {
  // ==========================================
  // 고객 디바이스 API
  // ==========================================

  // Register customer device
  app.post('/customer/me/devices', {
    preHandler: customerAuthGuard,
    schema: {
      description: '고객 디바이스 등록 (FCM 토큰)',
      tags: ['Customer - Notification'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fcmToken', 'platform'],
        properties: {
          fcmToken: { type: 'string' },
          platform: { type: 'string', enum: ['ios', 'android', 'web'] },
          deviceModel: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const customerId = request.user!.sub;
    const input = registerDeviceSchema.parse(request.body);

    const device = await notificationService.registerCustomerDevice(
      customerId,
      input.fcmToken,
      input.platform,
      input.deviceModel
    );

    return sendSuccess(reply, {
      id: device.id,
      platform: device.platform,
      registered: true,
    }, 201);
  });

  // Unregister customer device
  app.delete('/customer/me/devices/:token', {
    preHandler: customerAuthGuard,
    schema: {
      description: '고객 디바이스 해제',
      tags: ['Customer - Notification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const customerId = request.user!.sub;
    const { token } = request.params as { token: string };
    const decodedToken = decodeURIComponent(token);

    await notificationService.unregisterCustomerDevice(customerId, decodedToken);

    return sendSuccess(reply, { message: '디바이스가 해제되었습니다' });
  });

  // ==========================================
  // 점포 디바이스 API
  // ==========================================

  // Register store device
  app.post('/store/me/devices', {
    preHandler: storeAuthGuard,
    schema: {
      description: '점포 디바이스 등록 (FCM 토큰)',
      tags: ['Store - Notification'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fcmToken', 'platform'],
        properties: {
          fcmToken: { type: 'string' },
          platform: { type: 'string', enum: ['ios', 'android', 'web'] },
          deviceModel: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const accountId = request.user!.sub;
    const input = registerDeviceSchema.parse(request.body);

    const device = await notificationService.registerStoreDevice(
      accountId,
      input.fcmToken,
      input.platform,
      input.deviceModel
    );

    return sendSuccess(reply, {
      id: device.id,
      platform: device.platform,
      registered: true,
    }, 201);
  });

  // Unregister store device
  app.delete('/store/me/devices/:token', {
    preHandler: storeAuthGuard,
    schema: {
      description: '점포 디바이스 해제',
      tags: ['Store - Notification'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const accountId = request.user!.sub;
    const { token } = request.params as { token: string };
    const decodedToken = decodeURIComponent(token);

    await notificationService.unregisterStoreDevice(accountId, decodedToken);

    return sendSuccess(reply, { message: '디바이스가 해제되었습니다' });
  });

  // ==========================================
  // 알림 서비스 상태 (내부용)
  // ==========================================

  app.get('/internal/notification/status', {
    schema: {
      description: 'FCM 서비스 상태 확인',
      tags: ['Internal'],
    },
  }, async (_request, reply) => {
    return sendSuccess(reply, {
      fcmAvailable: fcmService.isAvailable(),
    });
  });
}
