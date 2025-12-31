import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../database/prisma.js';

// Mock prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    storeOwner: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    store: {
      create: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: any) => Promise<any>) => fn(prisma)),
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('$2a$10$hashed_password')),
    compare: vi.fn((plain: string, hash: string) =>
      Promise.resolve(plain === 'correct_password')
    ),
  },
}));

// Mock env
vi.mock('../../config/env.js', () => ({
  env: {
    PORT: 3001,
    HOST: 'localhost',
    NODE_ENV: 'test',
    API_VERSION: 'v1',
    JWT_SECRET: 'test-secret-key-at-least-32-chars',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
    DATABASE_URL: 'postgres://test',
    CORS_ORIGINS: '*',
  },
  isDev: false,
}));

describe('Auth Routes Integration', () => {
  let app: FastifyInstance;
  const mockPrisma = prisma as any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/store/register', () => {
    const validRegistration = {
      businessNumber: '1234567890',
      phone: '010-1234-5678',
      password: 'securePassword123!',
      ownerName: '홍길동',
      storeName: '테스트 가게',
      categoryId: 'cat_food_123',
      address: '서울시 강남구 테스트로 123',
      latitude: 37.5665,
      longitude: 126.978,
    };

    it('should register new store successfully', async () => {
      mockPrisma.storeOwner.findFirst.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat_food_123',
        name: '음식점',
      });
      mockPrisma.store.create.mockResolvedValue({
        id: 'store_new_123',
        name: '테스트 가게',
        categoryId: 'cat_food_123',
      });
      mockPrisma.storeOwner.create.mockResolvedValue({
        id: 'owner_new_123',
        phone: '010-1234-5678',
        name: '홍길동',
        storeId: 'store_new_123',
        store: {
          id: 'store_new_123',
          name: '테스트 가게',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/register',
        payload: validRegistration,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    it('should return 400 when phone number already exists', async () => {
      mockPrisma.storeOwner.findFirst.mockResolvedValue({
        id: 'existing_owner',
        phone: '010-1234-5678',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/register',
        payload: validRegistration,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/register',
        payload: {
          phone: '010-1234-5678',
          // Missing other required fields
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/store/login', () => {
    it('should login successfully with correct credentials', async () => {
      mockPrisma.storeOwner.findFirst.mockResolvedValue({
        id: 'owner_123',
        phone: '010-1234-5678',
        passwordHash: '$2a$10$hashed_password',
        name: '홍길동',
        storeId: 'store_123',
        store: {
          id: 'store_123',
          name: '테스트 가게',
          status: 'ACTIVE',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/login',
        payload: {
          phone: '010-1234-5678',
          password: 'correct_password',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.store).toBeDefined();
    });

    it('should return 401 with incorrect password', async () => {
      mockPrisma.storeOwner.findFirst.mockResolvedValue({
        id: 'owner_123',
        phone: '010-1234-5678',
        passwordHash: '$2a$10$hashed_password',
        store: { status: 'ACTIVE' },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/login',
        payload: {
          phone: '010-1234-5678',
          password: 'wrong_password',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 when user not found', async () => {
      mockPrisma.storeOwner.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/login',
        payload: {
          phone: '010-9999-9999',
          password: 'any_password',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/store/refresh', () => {
    it('should refresh tokens successfully', async () => {
      // Generate a valid refresh token first
      const refreshToken = app.jwt.sign(
        { sub: 'store_123', type: 'store', storeId: 'store_123' },
        { expiresIn: '7d' }
      );

      mockPrisma.storeOwner.findFirst.mockResolvedValue({
        id: 'owner_123',
        storeId: 'store_123',
        store: {
          id: 'store_123',
          name: '테스트 가게',
          status: 'ACTIVE',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/refresh',
        payload: { refreshToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/store/refresh',
        payload: { refreshToken: 'invalid-token' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/auth/customer/anonymous', () => {
    it('should create anonymous customer session', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue({
        id: 'customer_anon_123',
        isAnonymous: true,
        deviceId: 'device_uuid_123',
        nickname: '익명',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/customer/anonymous',
        payload: {
          deviceId: 'device_uuid_123',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
    });

    it('should return existing session if device already registered', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'customer_existing_123',
        isAnonymous: true,
        deviceId: 'device_uuid_123',
        nickname: '익명',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/customer/anonymous',
        payload: {
          deviceId: 'device_uuid_123',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.customer.id).toBe('customer_existing_123');
    });
  });

  describe('POST /api/v1/auth/customer/social', () => {
    it('should return 501 not implemented', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/customer/social',
        payload: {
          provider: 'kakao',
          token: 'kakao_token_123',
        },
      });

      expect(response.statusCode).toBe(501);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });
});
