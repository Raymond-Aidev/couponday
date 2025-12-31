import type { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service.js';
import {
  storeRegisterSchema,
  storeLoginSchema,
  refreshTokenSchema,
  customerAnonymousSchema,
} from './auth.schema.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);

  // Store registration
  app.post('/store/register', {
    schema: {
      description: '점포 회원가입',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['businessNumber', 'phone', 'password', 'ownerName', 'storeName', 'categoryId', 'address', 'latitude', 'longitude'],
        properties: {
          businessNumber: { type: 'string', description: '사업자등록번호 (10자리)' },
          phone: { type: 'string', description: '휴대폰 번호' },
          password: { type: 'string', description: '비밀번호' },
          ownerName: { type: 'string', description: '대표자명' },
          storeName: { type: 'string', description: '상호명' },
          categoryId: { type: 'string', format: 'uuid', description: '카테고리 ID' },
          address: { type: 'string', description: '주소' },
          latitude: { type: 'number', description: '위도' },
          longitude: { type: 'number', description: '경도' },
        },
      },
    },
  }, async (request, reply) => {
    const input = storeRegisterSchema.parse(request.body);
    const result = await authService.registerStore(input);
    return sendSuccess(reply, result, 201);
  });

  // Store login
  app.post('/store/login', {
    schema: {
      description: '점포 로그인',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['phone', 'password'],
        properties: {
          phone: { type: 'string', description: '휴대폰 번호' },
          password: { type: 'string', description: '비밀번호' },
        },
      },
    },
  }, async (request, reply) => {
    const input = storeLoginSchema.parse(request.body);
    const result = await authService.loginStore(input);
    return sendSuccess(reply, result);
  });

  // Token refresh
  app.post('/store/refresh', {
    schema: {
      description: '토큰 갱신',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: '리프레시 토큰' },
        },
      },
    },
  }, async (request, reply) => {
    const input = refreshTokenSchema.parse(request.body);
    const result = await authService.refreshToken(input.refreshToken);
    return sendSuccess(reply, result);
  });

  // Customer anonymous session
  app.post('/customer/anonymous', {
    schema: {
      description: '고객 비회원 세션 생성',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['deviceId'],
        properties: {
          deviceId: { type: 'string', description: '디바이스 ID' },
        },
      },
    },
  }, async (request, reply) => {
    const input = customerAnonymousSchema.parse(request.body);
    const result = await authService.createAnonymousSession(input);
    return sendSuccess(reply, result, 201);
  });

  // Customer social login (placeholder - would need actual social provider integration)
  app.post('/customer/social', {
    schema: {
      description: '고객 소셜 로그인',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['provider', 'token'],
        properties: {
          provider: { type: 'string', enum: ['kakao', 'naver', 'apple', 'google'] },
          token: { type: 'string', description: '소셜 로그인 토큰' },
        },
      },
    },
  }, async (_request, reply) => {
    // TODO: Implement social login
    return sendError(reply, 'NOT_IMPLEMENTED', '소셜 로그인은 아직 구현되지 않았습니다', 501);
  });
}
