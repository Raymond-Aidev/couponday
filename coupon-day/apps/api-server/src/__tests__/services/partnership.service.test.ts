import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartnershipService } from '../../modules/partnership/partnership.service.js';
import { prisma } from '../../database/prisma.js';

// Mock prisma
vi.mock('../../database/prisma.js', () => ({
  prisma: {
    store: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    partnership: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock errors
vi.mock('../../common/utils/errors.js', () => ({
  createError: vi.fn((code, options) => {
    const error = new Error(options?.message || code);
    (error as any).code = code;
    return error;
  }),
  ErrorCodes: {
    STORE_001: 'STORE_001',
    PARTNER_001: 'PARTNER_001',
    PARTNER_002: 'PARTNER_002',
    AUTH_001: 'AUTH_001',
    VALIDATION_001: 'VALIDATION_001',
  },
}));

describe('PartnershipService', () => {
  let service: PartnershipService;
  const mockPrisma = prisma as any;

  const createMockStore = (overrides = {}) => ({
    id: 'store_test_123',
    name: '테스트 가게',
    categoryId: 'cat_food',
    category: { id: 'cat_food', name: '한식' },
    address: '서울시 강남구 테스트로 123',
    latitude: 37.5665,
    longitude: 126.978,
    status: 'ACTIVE',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PartnershipService();
  });

  describe('getPartnerRecommendations', () => {
    it('should throw error when store not found', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null);

      await expect(service.getPartnerRecommendations('invalid_id'))
        .rejects.toThrow();
    });

    it('should exclude existing partners from recommendations', async () => {
      const myStore = createMockStore({ id: 'store_1' });
      const existingPartnerships = [
        { distributorStoreId: 'store_1', providerStoreId: 'store_2' },
        { distributorStoreId: 'store_3', providerStoreId: 'store_1' },
      ];
      const candidates = [
        createMockStore({ id: 'store_4', name: '카페A', categoryId: 'cat_cafe', category: { id: 'cat_cafe', name: '카페/디저트' } }),
        createMockStore({ id: 'store_5', name: '카페B', categoryId: 'cat_cafe', category: { id: 'cat_cafe', name: '카페/디저트' } }),
      ];

      mockPrisma.store.findUnique.mockResolvedValue(myStore);
      mockPrisma.partnership.findMany.mockResolvedValue(existingPartnerships);
      mockPrisma.store.findMany.mockResolvedValue(candidates);

      const result = await service.getPartnerRecommendations('store_1');

      expect(mockPrisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { notIn: expect.arrayContaining(['store_1', 'store_2', 'store_3']) },
          }),
        })
      );
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should only recommend stores with different categories', async () => {
      const myStore = createMockStore({ categoryId: 'cat_food', category: { id: 'cat_food', name: '한식' } });
      const candidates = [
        createMockStore({
          id: 'store_4',
          name: '카페A',
          categoryId: 'cat_cafe',
          category: { id: 'cat_cafe', name: '카페/디저트' },
          latitude: 37.5665 + 0.001,
          longitude: 126.978 + 0.001,
        }),
      ];

      mockPrisma.store.findUnique.mockResolvedValue(myStore);
      mockPrisma.partnership.findMany.mockResolvedValue([]);
      mockPrisma.store.findMany.mockResolvedValue(candidates);

      const result = await service.getPartnerRecommendations('store_test_123');

      expect(mockPrisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { not: 'cat_food' },
          }),
        })
      );
    });

    it('should calculate match scores and include reasons', async () => {
      const myStore = createMockStore({
        categoryId: 'cat_food',
        category: { id: 'cat_food', name: '한식' },
        latitude: 37.5665,
        longitude: 126.978,
      });
      const candidates = [
        createMockStore({
          id: 'store_4',
          name: '카페A',
          categoryId: 'cat_cafe',
          category: { id: 'cat_cafe', name: '카페/디저트' },
          latitude: 37.5667, // ~200m away
          longitude: 126.9782,
        }),
      ];

      mockPrisma.store.findUnique.mockResolvedValue(myStore);
      mockPrisma.partnership.findMany.mockResolvedValue([]);
      mockPrisma.store.findMany.mockResolvedValue(candidates);

      const result = await service.getPartnerRecommendations('store_test_123');

      expect(result).toHaveLength(1);
      expect(result[0].store.id).toBe('store_4');
      expect(result[0].matchScore).toBeGreaterThan(0);
      expect(result[0].matchScore).toBeLessThanOrEqual(100);
      expect(result[0].categoryTransition).toBeDefined();
      expect(result[0].categoryTransition?.from).toBe('한식');
      expect(result[0].categoryTransition?.to).toBe('카페/디저트');
    });

    it('should sort recommendations by score descending', async () => {
      const myStore = createMockStore({
        categoryId: 'cat_food',
        category: { id: 'cat_food', name: '한식' },
        latitude: 37.5665,
        longitude: 126.978,
      });
      const candidates = [
        createMockStore({
          id: 'store_far',
          name: '멀리있는카페',
          categoryId: 'cat_cafe',
          category: { id: 'cat_cafe', name: '카페/디저트' },
          latitude: 37.57, // far away
          longitude: 126.99,
        }),
        createMockStore({
          id: 'store_near',
          name: '가까운카페',
          categoryId: 'cat_cafe',
          category: { id: 'cat_cafe', name: '카페/디저트' },
          latitude: 37.5667, // close ~200m
          longitude: 126.9782,
        }),
      ];

      mockPrisma.store.findUnique.mockResolvedValue(myStore);
      mockPrisma.partnership.findMany.mockResolvedValue([]);
      mockPrisma.store.findMany.mockResolvedValue(candidates);

      const result = await service.getPartnerRecommendations('store_test_123');

      // Closer store should have higher score due to distance points
      expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore);
    });

    it('should respect limit parameter', async () => {
      const myStore = createMockStore();
      const candidates = Array.from({ length: 20 }, (_, i) =>
        createMockStore({
          id: `store_${i}`,
          name: `가게${i}`,
          categoryId: 'cat_cafe',
          category: { id: 'cat_cafe', name: '카페/디저트' }
        })
      );

      mockPrisma.store.findUnique.mockResolvedValue(myStore);
      mockPrisma.partnership.findMany.mockResolvedValue([]);
      mockPrisma.store.findMany.mockResolvedValue(candidates);

      const result = await service.getPartnerRecommendations('store_test_123', 'provider', 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('requestPartnership', () => {
    it('should throw error for self-partnership', async () => {
      await expect(service.requestPartnership('store_1', 'store_1'))
        .rejects.toThrow();
    });

    it('should throw error when partnership already exists', async () => {
      mockPrisma.partnership.findFirst.mockResolvedValue({
        id: 'existing_partnership',
        distributorStoreId: 'store_1',
        providerStoreId: 'store_2',
      });

      await expect(service.requestPartnership('store_1', 'store_2'))
        .rejects.toThrow();
    });

    it('should create partnership request successfully', async () => {
      mockPrisma.partnership.findFirst.mockResolvedValue(null);
      mockPrisma.partnership.create.mockResolvedValue({
        id: 'new_partnership',
        distributorStoreId: 'store_1',
        providerStoreId: 'store_2',
        status: 'PENDING',
        requestedBy: 'store_1',
        distributorStore: { id: 'store_1', name: '가게1' },
        providerStore: { id: 'store_2', name: '가게2' },
      });

      const result = await service.requestPartnership('store_1', 'store_2');

      expect(result.status).toBe('PENDING');
      expect(result.requestedBy).toBe('store_1');
      expect(mockPrisma.partnership.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            distributorStoreId: 'store_1',
            providerStoreId: 'store_2',
            status: 'PENDING',
            requestedBy: 'store_1',
          }),
        })
      );
    });

    it('should check both direction for existing partnership', async () => {
      mockPrisma.partnership.findFirst.mockResolvedValue(null);
      mockPrisma.partnership.create.mockResolvedValue({
        id: 'new_partnership',
        distributorStoreId: 'store_1',
        providerStoreId: 'store_2',
        status: 'PENDING',
        distributorStore: { id: 'store_1', name: '가게1' },
        providerStore: { id: 'store_2', name: '가게2' },
      });

      await service.requestPartnership('store_1', 'store_2');

      expect(mockPrisma.partnership.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { distributorStoreId: 'store_1', providerStoreId: 'store_2' },
            { distributorStoreId: 'store_2', providerStoreId: 'store_1' },
          ],
        },
      });
    });
  });

  describe('respondToPartnership', () => {
    const mockPartnership = {
      id: 'partnership_123',
      distributorStoreId: 'store_1',
      providerStoreId: 'store_2',
      status: 'PENDING',
      requestedBy: 'store_1',
    };

    it('should throw error when partnership not found', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(null);

      await expect(service.respondToPartnership('invalid_id', 'store_2', true))
        .rejects.toThrow();
    });

    it('should throw error when responder is not involved in partnership', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(mockPartnership);

      await expect(service.respondToPartnership('partnership_123', 'store_3', true))
        .rejects.toThrow();
    });

    it('should throw error when requester tries to respond to own request', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(mockPartnership);

      await expect(service.respondToPartnership('partnership_123', 'store_1', true))
        .rejects.toThrow('자신의 요청에는 응답할 수 없습니다');
    });

    it('should accept partnership and set status to ACTIVE', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(mockPartnership);
      mockPrisma.partnership.update.mockResolvedValue({
        ...mockPartnership,
        status: 'ACTIVE',
        respondedAt: new Date(),
      });

      const result = await service.respondToPartnership('partnership_123', 'store_2', true);

      expect(mockPrisma.partnership.update).toHaveBeenCalledWith({
        where: { id: 'partnership_123' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          respondedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should reject partnership and set status to TERMINATED', async () => {
      mockPrisma.partnership.findUnique.mockResolvedValue(mockPartnership);
      mockPrisma.partnership.update.mockResolvedValue({
        ...mockPartnership,
        status: 'TERMINATED',
        respondedAt: new Date(),
        terminatedAt: new Date(),
      });

      const result = await service.respondToPartnership('partnership_123', 'store_2', false);

      expect(mockPrisma.partnership.update).toHaveBeenCalledWith({
        where: { id: 'partnership_123' },
        data: expect.objectContaining({
          status: 'TERMINATED',
          terminatedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getPartnerships', () => {
    it('should get all partnerships for a store', async () => {
      const mockPartnerships = [
        {
          id: 'partnership_1',
          distributorStoreId: 'store_1',
          providerStoreId: 'store_2',
          status: 'ACTIVE',
          distributorStore: { id: 'store_1', name: '가게1' },
          providerStore: { id: 'store_2', name: '가게2' },
          crossCoupons: [],
          _count: { mealTokens: 10 },
        },
        {
          id: 'partnership_2',
          distributorStoreId: 'store_3',
          providerStoreId: 'store_1',
          status: 'ACTIVE',
          distributorStore: { id: 'store_3', name: '가게3' },
          providerStore: { id: 'store_1', name: '가게1' },
          crossCoupons: [],
          _count: { mealTokens: 5 },
        },
      ];

      mockPrisma.partnership.findMany.mockResolvedValue(mockPartnerships);

      const result = await service.getPartnerships('store_1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.partnership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { distributorStoreId: 'store_1' },
              { providerStoreId: 'store_1' },
            ],
          },
        })
      );
    });

    it('should filter partnerships by status', async () => {
      mockPrisma.partnership.findMany.mockResolvedValue([]);

      await service.getPartnerships('store_1', 'ACTIVE');

      expect(mockPrisma.partnership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should include related data (stores, coupons, token count)', async () => {
      mockPrisma.partnership.findMany.mockResolvedValue([]);

      await service.getPartnerships('store_1');

      expect(mockPrisma.partnership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            distributorStore: expect.any(Object),
            providerStore: expect.any(Object),
            crossCoupons: expect.any(Object),
            _count: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance correctly between two points', async () => {
      const myStore = createMockStore({
        latitude: 37.5665,
        longitude: 126.978,
      });
      // Approximately 1km away
      const candidates = [
        createMockStore({
          id: 'store_1km',
          name: '1km 떨어진 가게',
          categoryId: 'cat_cafe',
          category: { id: 'cat_cafe', name: '카페/디저트' },
          latitude: 37.5755, // ~1km north
          longitude: 126.978,
        }),
      ];

      mockPrisma.store.findUnique.mockResolvedValue(myStore);
      mockPrisma.partnership.findMany.mockResolvedValue([]);
      mockPrisma.store.findMany.mockResolvedValue(candidates);

      const result = await service.getPartnerRecommendations('store_test_123');

      // Distance should be approximately 1000m
      expect(result[0].store.distance).toBeGreaterThan(900);
      expect(result[0].store.distance).toBeLessThan(1100);
    });
  });
});
