import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.warn('Seeding database...');

  // Create categories with Seoul API type mappings
  const categories = await Promise.all([
    prisma.storeCategory.create({
      data: {
        name: '한식',
        nameEn: 'Korean',
        icon: 'korean',
        displayOrder: 1,
        seoulApiTypes: ['한식', '식육(숯불구이)', '탕류(보신용)', '정종/대포집/소주방'],
      },
    }),
    prisma.storeCategory.create({
      data: {
        name: '중식',
        nameEn: 'Chinese',
        icon: 'chinese',
        displayOrder: 2,
        seoulApiTypes: ['중국식'],
      },
    }),
    prisma.storeCategory.create({
      data: {
        name: '일식',
        nameEn: 'Japanese',
        icon: 'japanese',
        displayOrder: 3,
        seoulApiTypes: ['일식', '회집'],
      },
    }),
    prisma.storeCategory.create({
      data: {
        name: '양식',
        nameEn: 'Western',
        icon: 'western',
        displayOrder: 4,
        seoulApiTypes: ['경양식', '패밀리레스토랑', '패스트푸드'],
      },
    }),
    prisma.storeCategory.create({
      data: {
        name: '카페/디저트',
        nameEn: 'Cafe/Dessert',
        icon: 'cafe',
        displayOrder: 5,
        seoulApiTypes: ['까페', '다방', '전통찻집', '호프/통닭', '감성주점'],
      },
    }),
    prisma.storeCategory.create({
      data: {
        name: '분식',
        nameEn: 'Snack',
        icon: 'snack',
        displayOrder: 6,
        seoulApiTypes: ['분식', '김밥(도시락)', '뷔페식'],
      },
    }),
    prisma.storeCategory.create({
      data: {
        name: '기타',
        nameEn: 'Other',
        icon: 'other',
        displayOrder: 7,
        seoulApiTypes: ['기타', '외국음식전문점(인도,태국등)', '복어취급', '출장조리', '이동조리'],
      },
    }),
  ]);

  console.warn(`Created ${categories.length} categories`);

  // Create test stores
  const passwordHash = await bcrypt.hash('test1234', 12);

  const store1 = await prisma.store.create({
    data: {
      businessNumber: '1234567890',
      name: '엄마손 김치찌개',
      description: '정성 가득 엄마의 손맛',
      categoryId: categories[0]!.id, // 한식
      address: '서울시 강남구 역삼동 123-45',
      latitude: 37.4979,
      longitude: 127.0276,
      status: 'ACTIVE',
      isVerified: true,
      verifiedAt: new Date(),
      operatingHours: {
        mon: { open: '11:00', close: '21:00' },
        tue: { open: '11:00', close: '21:00' },
        wed: { open: '11:00', close: '21:00' },
        thu: { open: '11:00', close: '21:00' },
        fri: { open: '11:00', close: '21:00' },
        sat: { open: '11:00', close: '20:00' },
        sun: { closed: true },
      },
    },
  });

  await prisma.storeAccount.create({
    data: {
      storeId: store1.id,
      phone: '01012345678',
      passwordHash,
      ownerName: '김사장',
      role: 'OWNER',
    },
  });

  // Create menu items for store1
  const items1 = await Promise.all([
    prisma.item.create({
      data: {
        storeId: store1.id,
        name: '김치찌개',
        description: '돼지고기와 묵은지로 끓인 얼큰한 김치찌개',
        category: '찌개류',
        price: 9000,
        cost: 3500,
        isPopular: true,
        displayOrder: 1,
      },
    }),
    prisma.item.create({
      data: {
        storeId: store1.id,
        name: '된장찌개',
        description: '구수한 된장과 신선한 채소',
        category: '찌개류',
        price: 8500,
        cost: 3000,
        displayOrder: 2,
      },
    }),
    prisma.item.create({
      data: {
        storeId: store1.id,
        name: '제육볶음',
        description: '매콤달콤 고추장 양념 제육',
        category: '볶음류',
        price: 10000,
        cost: 4000,
        displayOrder: 3,
      },
    }),
  ]);

  // Create coupon for store1
  const coupon1 = await prisma.coupon.create({
    data: {
      storeId: store1.id,
      name: '점심 특가 2000원 할인',
      description: '평일 점심시간 방문 시 2000원 할인',
      discountType: 'FIXED',
      discountValue: 2000,
      targetScope: 'ALL',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      availableDays: [1, 2, 3, 4, 5], // Mon-Fri
      availableTimeStart: '11:00',
      availableTimeEnd: '14:00',
      totalQuantity: 100,
      dailyLimit: 10,
      perUserLimit: 1,
      status: 'ACTIVE',
      distributionChannels: ['app'],
    },
  });

  console.warn(`Created store: ${store1.name}`);

  // Create second test store (for partnership demo)
  const store2 = await prisma.store.create({
    data: {
      businessNumber: '0987654321',
      name: '카페 모카',
      description: '따뜻한 커피와 디저트',
      categoryId: categories[4]!.id, // 카페/디저트
      address: '서울시 강남구 역삼동 200-10',
      latitude: 37.4985,
      longitude: 127.0280,
      status: 'ACTIVE',
      isVerified: true,
      verifiedAt: new Date(),
      operatingHours: {
        mon: { open: '08:00', close: '22:00' },
        tue: { open: '08:00', close: '22:00' },
        wed: { open: '08:00', close: '22:00' },
        thu: { open: '08:00', close: '22:00' },
        fri: { open: '08:00', close: '23:00' },
        sat: { open: '10:00', close: '23:00' },
        sun: { open: '10:00', close: '21:00' },
      },
    },
  });

  await prisma.storeAccount.create({
    data: {
      storeId: store2.id,
      phone: '01087654321',
      passwordHash,
      ownerName: '박사장',
      role: 'OWNER',
    },
  });

  // Create menu items for store2
  await Promise.all([
    prisma.item.create({
      data: {
        storeId: store2.id,
        name: '아메리카노',
        category: '커피',
        price: 4500,
        cost: 1000,
        isPopular: true,
        displayOrder: 1,
      },
    }),
    prisma.item.create({
      data: {
        storeId: store2.id,
        name: '카페라떼',
        category: '커피',
        price: 5000,
        cost: 1200,
        displayOrder: 2,
      },
    }),
    prisma.item.create({
      data: {
        storeId: store2.id,
        name: '티라미수',
        category: '디저트',
        price: 6500,
        cost: 2500,
        displayOrder: 3,
      },
    }),
  ]);

  console.warn(`Created store: ${store2.name}`);

  // Create partnership between stores
  const partnership = await prisma.partnership.create({
    data: {
      distributorStoreId: store1.id,
      providerStoreId: store2.id,
      status: 'ACTIVE',
      requestedBy: store1.id,
      respondedAt: new Date(),
      commissionPerRedemption: 500,
    },
  });

  // Create cross coupon
  await prisma.crossCoupon.create({
    data: {
      partnershipId: partnership.id,
      providerStoreId: store2.id,
      name: '식사 후 커피 1000원 할인',
      discountType: 'FIXED',
      discountValue: 1000,
      description: '김치찌개 맛집에서 식사 후 방문하면 커피 할인!',
      redemptionWindow: 'next_day',
      availableTimeStart: '11:00',
      availableTimeEnd: '18:00',
      dailyLimit: 20,
      isActive: true,
    },
  });

  console.warn('Created partnership and cross coupon');

  // Create test customer
  const customer = await prisma.customer.create({
    data: {
      deviceId: 'test-device-001',
      nickname: '테스트고객',
    },
  });

  console.warn(`Created customer: ${customer.nickname}`);

  // Create commercial area
  await prisma.commercialArea.create({
    data: {
      name: '역삼역 상권',
      type: 'business',
      centerLatitude: 37.4980,
      centerLongitude: 127.0275,
      characteristics: {
        peakHours: ['12:00-13:00', '18:00-19:00'],
        mainCustomers: ['직장인', '학생'],
      },
    },
  });

  console.warn('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
