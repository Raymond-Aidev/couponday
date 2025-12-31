import { z } from 'zod';

// Store update schema
export const storeUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  phone: z.string().regex(/^0[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$/).optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).optional(),
  addressDetail: z.string().max(100).optional(),
  postalCode: z.string().regex(/^\d{5}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  operatingHours: z.record(z.any()).optional(),
  seatingCapacity: z.number().int().positive().optional(),
  hasParking: z.boolean().optional(),
  hasDelivery: z.boolean().optional(),
  deliveryPlatforms: z.array(z.string()).optional(),
});

export type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;

// Item schemas
export const itemCreateSchema = z.object({
  name: z.string().min(1, '메뉴명을 입력해주세요').max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  price: z.number().int().positive('가격은 0보다 커야 합니다'),
  cost: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(0),
  options: z.any().optional(),
});

export type ItemCreateInput = z.infer<typeof itemCreateSchema>;

export const itemUpdateSchema = itemCreateSchema.partial();
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;

// Coupon schemas
export const couponCreateSchema = z.object({
  name: z.string().min(1, '쿠폰명을 입력해주세요').max(100),
  description: z.string().max(500).optional(),
  discountType: z.enum(['FIXED', 'PERCENTAGE', 'BOGO', 'BUNDLE', 'FREEBIE', 'CONDITIONAL']),
  discountValue: z.number().int().positive().optional(),
  discountCondition: z.any().optional(),
  targetScope: z.enum(['ALL', 'CATEGORY', 'SPECIFIC']).default('SPECIFIC'),
  targetCategory: z.string().optional(),
  targetItemIds: z.array(z.string().uuid()).optional(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  availableDays: z.array(z.number().int().min(0).max(6)).default([]),
  availableTimeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  availableTimeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  blackoutDates: z.array(z.coerce.date()).default([]),
  totalQuantity: z.number().int().positive().optional(),
  dailyLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  distributionChannels: z.array(z.string()).default(['app']),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE']).default('DRAFT'),
});

export type CouponCreateInput = z.infer<typeof couponCreateSchema>;

export const couponUpdateSchema = couponCreateSchema.partial();
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const couponStatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED']),
});

export type CouponStatusUpdateInput = z.infer<typeof couponStatusUpdateSchema>;
