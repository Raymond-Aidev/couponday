// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    ANONYMOUS: '/auth/customer/anonymous',
    SOCIAL: '/auth/customer/social',
    REFRESH: '/auth/customer/refresh',
  },

  // Customer
  CUSTOMER: {
    ME: '/customer/me',
    FAVORITES: '/customer/me/favorites',
  },

  // Coupons
  COUPONS: {
    NEARBY: '/customer/coupons/nearby',
    MAP: '/customer/coupons/map',
    DETAIL: (id: string) => `/customer/coupons/${id}`,
    SAVE: (id: string) => `/customer/coupons/${id}/save`,
    MY_COUPONS: '/customer/me/coupons',
    MY_COUPON_QR: (id: string) => `/customer/me/coupons/${id}/qr`,
  },

  // Stores
  STORES: {
    SEARCH: '/customer/stores/search',
    DETAIL: (id: string) => `/customer/stores/${id}`,
    FAVORITE: (id: string) => `/customer/stores/${id}/favorite`,
  },

  // Redemptions
  REDEMPTIONS: {
    CREATE: '/redemptions',
  },

  // Meal Tokens (Cross Coupon)
  TOKENS: {
    AVAILABLE: (code: string) => `/customer/tokens/${code}/available-coupons`,
    SELECT: (code: string) => `/customer/tokens/${code}/select`,
  },
};

// Request Timeout
export const REQUEST_TIMEOUT = 30000;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'customer_accessToken',
  REFRESH_TOKEN: 'customer_refreshToken',
  USER_DATA: 'customer_userData',
  ANONYMOUS_ID: 'customer_anonymousId',
};
