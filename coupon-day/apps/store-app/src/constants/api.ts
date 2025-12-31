// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/store/login',
    REGISTER: '/auth/store/register',
    REFRESH: '/auth/store/refresh',
    LOGOUT: '/auth/store/logout',
  },

  // Store
  STORE: {
    ME: '/store/me',
    DASHBOARD: '/store/me/dashboard',
    ITEMS: '/store/me/items',
  },

  // Coupons
  COUPONS: {
    LIST: '/store/me/coupons',
    CREATE: '/store/me/coupons',
    DETAIL: (id: string) => `/store/me/coupons/${id}`,
    UPDATE: (id: string) => `/store/me/coupons/${id}`,
    STATUS: (id: string) => `/store/me/coupons/${id}/status`,
    QR: (id: string) => `/store/me/coupons/${id}/qr`,
    PERFORMANCE: (id: string) => `/store/me/coupons/${id}/performance`,
    RECOMMENDATIONS: '/store/me/coupons/recommendations',
  },

  // Partnerships
  PARTNERSHIPS: {
    LIST: '/store/me/partnerships',
    RECOMMENDATIONS: '/store/me/partnerships/recommendations',
    REQUESTS: '/store/me/partnerships/requests',
    RESPOND: (id: string) => `/store/me/partnerships/requests/${id}`,
    DETAIL: (id: string) => `/store/me/partnerships/${id}`,
    SETTLEMENTS: (id: string) => `/store/me/partnerships/${id}/settlements`,
  },

  // Cross Coupons
  CROSS_COUPONS: {
    LIST: '/store/me/cross-coupons',
    CREATE: '/store/me/cross-coupons',
    UPDATE: (id: string) => `/store/me/cross-coupons/${id}`,
    DELETE: (id: string) => `/store/me/cross-coupons/${id}`,
  },

  // Meal Tokens
  MEAL_TOKENS: {
    ISSUE: '/store/me/tokens',
    VERIFY: '/store/me/tokens/verify',
  },

  // Settlements
  SETTLEMENTS: {
    LIST: '/store/me/settlements',
  },
};

// Request Timeout
export const REQUEST_TIMEOUT = 30000;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  STORE_DATA: 'storeData',
};
