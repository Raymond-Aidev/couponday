import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env, isDev } from './config/env.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { storeRoutes } from './modules/store/store.routes.js';
import { customerRoutes } from './modules/customer/customer.routes.js';
import { couponRoutes } from './modules/coupon/coupon.routes.js';
import { redemptionRoutes } from './modules/redemption/redemption.routes.js';
import { partnershipRoutes } from './modules/partnership/partnership.routes.js';
import { crossCouponRoutes } from './modules/cross-coupon/cross-coupon.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';

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

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // API routes
  await app.register(authRoutes, { prefix: `/api/${env.API_VERSION}/auth` });
  await app.register(storeRoutes, { prefix: `/api/${env.API_VERSION}/store` });
  await app.register(customerRoutes, { prefix: `/api/${env.API_VERSION}/customer` });
  await app.register(couponRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(redemptionRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(partnershipRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(crossCouponRoutes, { prefix: `/api/${env.API_VERSION}` });
  await app.register(analyticsRoutes, { prefix: `/api/${env.API_VERSION}` });

  return app;
}
