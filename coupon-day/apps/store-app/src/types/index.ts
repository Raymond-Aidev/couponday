export * from '@coupon-day/shared-types';

import {
  DiscountType,
  CouponStatus,
  Category,
  OperatingHours,
  Partnership,
  PartnerStore,
  CrossCoupon,
  MealTokenStatus
} from '@coupon-day/shared-types';

// Re-exporting aliases for backward compatibility or convenience if needed
// but preferably we should use the shared names.

// Dashboard Types (if not fully covered or extendable)
// Shared types already have DashboardData, CouponRecommendation, ActivityItem.
// We can just export * from shared-types.

// Navigation Types (App specific)
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Coupons: undefined;
  Partnership: undefined;
  Settings: undefined;
};

export type CouponStackParamList = {
  CouponList: undefined;
  CouponDetail: { couponId: string };
  CouponCreate: undefined;
  CouponPerformance: { couponId: string };
};

export type PartnershipStackParamList = {
  PartnershipList: undefined;
  PartnershipRecommendations: undefined;
  PartnershipDetail: { partnershipId: string };
  PartnershipRequests: undefined;
};
