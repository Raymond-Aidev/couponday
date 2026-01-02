import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env, isDev } from './config/env.js';
import { errorHandler } from './common/middleware/error-handler.js';
import performancePlugin, { performanceMonitor } from './common/plugins/performance.plugin.js';
import multipartPlugin from './common/plugins/multipart.plugin.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { storeRoutes } from './modules/store/store.routes.js';
import { customerRoutes } from './modules/customer/customer.routes.js';
import { couponRoutes } from './modules/coupon/coupon.routes.js';
import { redemptionRoutes } from './modules/redemption/redemption.routes.js';
import { partnershipRoutes } from './modules/partnership/partnership.routes.js';
import { crossCouponRoutes } from './modules/cross-coupon/cross-coupon.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { categoryRoutes } from './modules/category/category.routes.js';
import { publicStoreRoutes } from './modules/public-store/public-store.routes.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { sendSuccess } from './common/utils/response.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: isDev ? 'info' : 'warn',
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Security plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100, // max 100 requests per window
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_001',
        message: `요청 한도를 초과했습니다. ${Math.ceil(context.ttl / 1000)}초 후에 다시 시도해주세요.`,
      },
    }),
    keyGenerator: (request) => {
      // Use user ID if authenticated, otherwise use IP
      return request.user?.sub || request.ip;
    },
    // Different limits for different routes
    allowList: ['/health', '/docs'],
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'CouponDay API',
        description: '소상공인 쿠폰 생태계 플랫폼 API',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Performance monitoring
  await app.register(performancePlugin);

  // Multipart file upload
  await app.register(multipartPlugin);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Performance monitoring endpoints
  app.get('/internal/performance', async (_request, reply) => {
    return sendSuccess(reply, performanceMonitor.getStats());
  });

  app.get('/internal/performance/endpoints', async (_request, reply) => {
    return sendSuccess(reply, performanceMonitor.getEndpointPerformance());
  });

  // API routes
  await app.register(authRoutes, { prefix: `/api/${env.API_VERSION}/auth` });
  await app.register(storeRoutes, { prefix: `/api/${env.API_VERSION}/store` });
  await app.register(customerRoutes, { prefix: `/api/${env.API_VERSION}/customer` });
  await app.register(couponRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(redemptionRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(partnershipRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(crossCouponRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(analyticsRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(categoryRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(publicStoreRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(uploadRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(notificationRoutes, { prefix: `/api/${env.API_VERSION}` });

  return app;
}
