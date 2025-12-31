// Store types
export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
export type StoreRole = 'OWNER' | 'MANAGER' | 'STAFF';

// Coupon types
export type DiscountType = 'FIXED' | 'PERCENTAGE' | 'BOGO' | 'BUNDLE' | 'FREEBIE' | 'CONDITIONAL';
export type TargetScope = 'ALL' | 'CATEGORY' | 'SPECIFIC';
export type CouponStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED';
export type SavedCouponStatus = 'ACTIVE' | 'USED' | 'EXPIRED';

// Partnership types
export type PartnershipStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'TERMINATED';
export type MealTokenStatus = 'ISSUED' | 'SELECTED' | 'REDEEMED' | 'EXPIRED';
export type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'PAID';

// API Response types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoreLoginResponse extends AuthTokens {
  store: {
    id: string;
    name: string;
    businessNumber: string;
  };
  account: {
    id: string;
    ownerName: string;
    phone: string;
  };
}

export interface CustomerLoginResponse extends AuthTokens {
  customer: {
    id: string;
    nickname: string | null;
    isAnonymous: boolean;
  };
}

export interface StoreUser {
  id: string;
  email: string;
  name: string;
  businessNumber: string;
  phone: string;
  createdAt: string;
}

// Store Types
export interface Store {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  categoryId: string;
  category: Category;
  operatingHours: OperatingHours | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export interface OperatingHours {
  mon?: { open: string; close: string };
  tue?: { open: string; close: string };
  wed?: { open: string; close: string };
  thu?: { open: string; close: string };
  fri?: { open: string; close: string };
  sat?: { open: string; close: string };
  sun?: { open: string; close: string };
}

// Coupon Types
export interface Coupon {
  id: string;
  name: string;
  description: string | null;
  type: DiscountType; // Use shared DiscountType
  discountValue: number | null;
  minOrderAmount: number | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  validFrom: string;
  validUntil: string;
  availableTimeStart: string | null;
  availableTimeEnd: string | null;
  availableDays: number[] | null;
  status: CouponStatus; // Use shared CouponStatus
  createdAt: string;
}

export interface CouponCreateInput {
  name: string;
  description?: string;
  type: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxRedemptions?: number;
  validFrom: string;
  validUntil: string;
  availableTimeStart?: string;
  availableTimeEnd?: string;
  availableDays?: number[];
}

// Dashboard Types
export interface DashboardData {
  todaySales: number;
  todayRedemptions: number;
  activeCoupons: number;
  recommendations: CouponRecommendation[];
  recentActivity: ActivityItem[];
}

export interface CouponRecommendation {
  id: string;
  templateName: string;
  reason: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActivityItem {
  id: string;
  type: 'redemption' | 'save' | 'expiry';
  message: string;
  timestamp: string;
}

// Partnership Types
export interface Partnership {
  id: string;
  distributorStore: PartnerStore;
  providerStore: PartnerStore;
  status: PartnershipStatus; // Use shared PartnershipStatus
  commissionPerRedemption: number;
  createdAt: string;
}

export interface PartnerStore {
  id: string;
  name: string;
  category: Category;
  address: string;
}

export interface PartnerRecommendation {
  store: PartnerStore;
  matchScore: number;
  categoryConversionScore: number;
  distanceScore: number;
  priceScore: number;
  peakTimeScore: number;
  estimatedMonthlyRedemptions: number;
}

// Cross Coupon Types
export interface CrossCoupon {
  id: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number | null;
  dailyLimit: number | null;
  redemptionWindow: 'same_day' | 'next_day' | 'within_week';
  availableTimeStart: string | null;
  availableTimeEnd: string | null;
  isActive: boolean;
}

// Meal Token Types
export interface MealToken {
  id: string;
  tokenCode: string;
  status: MealTokenStatus; // Use shared MealTokenStatus
  expiresAt: string;
  createdAt: string;
  selectedCrossCoupon?: CrossCoupon;
}

// Settlement Types
export interface Settlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalRedemptions: number;
  totalCommission: number;
  status: SettlementStatus; // Use shared SettlementStatus
  partnership: Partnership;
}
