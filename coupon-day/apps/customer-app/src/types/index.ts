// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CustomerUser {
  id: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationWithAddress extends Location {
  address?: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

// Store Types
export interface Store {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  category: Category;
  operatingHours: OperatingHours | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  distance?: number;
  isOpen?: boolean;
  isFavorite?: boolean;
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
export type CouponType = 'DISCOUNT_AMOUNT' | 'DISCOUNT_RATE' | 'FREE_ITEM' | 'BUNDLE';
export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'USED';

export interface Coupon {
  id: string;
  name: string;
  description: string | null;
  type: CouponType;
  discountValue: number | null;
  freeItemName: string | null;
  minOrderAmount: number | null;
  validFrom: string;
  validUntil: string;
  availableTimeStart: string | null;
  availableTimeEnd: string | null;
  store: Store;
  distance?: number;
  isSaved?: boolean;
}

export interface SavedCoupon extends Coupon {
  savedAt: string;
  usedAt: string | null;
  status: CouponStatus;
}

// Map Types
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  store: Store;
  couponCount: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Cross Coupon Types
export interface CrossCouponOption {
  id: string;
  name: string;
  description: string | null;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number | null;
  providerStore: {
    id: string;
    name: string;
    category: Category;
    address: string;
    distance?: number;
  };
}

export interface MealToken {
  code: string;
  expiresAt: string;
  selectedCoupon?: CrossCouponOption;
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  StoreDetail: { storeId: string };
  CouponDetail: { couponId: string };
  TokenScan: undefined;
  TokenSelect: { tokenCode: string };
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  MyCoupons: undefined;
  CrossCoupon: undefined;
  MyPage: undefined;
};

// Filter Types
export interface CouponFilter {
  categoryId?: string;
  sortBy?: 'distance' | 'discount' | 'expiry';
  maxDistance?: number;
}
