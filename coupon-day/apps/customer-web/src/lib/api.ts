import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
};

export const getAccessToken = () => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; page: number; limit: number };
}

// Customer Auth API
export const authApi = {
  createAnonymous: async (deviceId: string) => {
    const response = await api.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      customer: { id: string; nickname: string | null; isAnonymous: boolean };
    }>>('/auth/customer/anonymous', { deviceId });
    return response.data;
  },
};

// Coupon API
export const couponApi = {
  getNearby: async (lat: number, lng: number, radius: number = 1000) => {
    const response = await api.get<ApiResponse<Coupon[]>>('/customer/coupons/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Coupon>>(`/customer/coupons/${id}`);
    return response.data;
  },

  save: async (couponId: string) => {
    const response = await api.post<ApiResponse<SavedCoupon>>(`/customer/coupons/${couponId}/save`);
    return response.data;
  },

  getMySavedCoupons: async () => {
    const response = await api.get<ApiResponse<SavedCoupon[]>>('/customer/me/coupons');
    return response.data;
  },

  getSavedCouponQR: async (savedCouponId: string) => {
    const response = await api.get<ApiResponse<{
      qrCode: string;
      qrData: string;
      expiresAt: string;
    }>>(`/customer/me/coupons/${savedCouponId}/qr`);
    return response.data;
  },

  getForMap: async (lat: number, lng: number, zoom: number = 15) => {
    const response = await api.get<ApiResponse<MapCoupon[]>>('/customer/coupons/map', {
      params: { lat, lng, zoom },
    });
    return response.data;
  },
};

// Store API
export const storeApi = {
  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Store>>(`/customer/stores/${id}`);
    return response.data;
  },

  search: async (query: string, lat?: number, lng?: number) => {
    const response = await api.get<ApiResponse<Store[]>>('/customer/stores/search', {
      params: { q: query, lat, lng },
    });
    return response.data;
  },
};

// Favorites API
export const favoritesApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<FavoriteStore[]>>('/customer/me/favorites');
    return response.data;
  },

  add: async (storeId: string) => {
    const response = await api.post<ApiResponse<{ id: string; storeId: string; storeName: string }>>(
      `/customer/stores/${storeId}/favorite`
    );
    return response.data;
  },

  remove: async (storeId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/customer/stores/${storeId}/favorite`
    );
    return response.data;
  },
};

// Customer Profile API
export const profileApi = {
  getMe: async () => {
    const response = await api.get<ApiResponse<CustomerProfile>>('/customer/me');
    return response.data;
  },

  update: async (data: { nickname?: string }) => {
    const response = await api.patch<ApiResponse<{ id: string; nickname: string; phone: string | null }>>(
      '/customer/me',
      data
    );
    return response.data;
  },
};

// Token API (for cross-coupon)
export const tokenApi = {
  getMyTokens: async () => {
    const response = await api.get<ApiResponse<MealToken[]>>('/customer/me/tokens');
    return response.data;
  },

  getAvailableCoupons: async (code: string) => {
    const response = await api.get<ApiResponse<CrossCouponOption[]>>(
      `/customer/tokens/${code}/available-coupons`
    );
    return response.data;
  },

  selectCoupon: async (code: string, crossCouponId: string) => {
    const response = await api.post<ApiResponse<{ success: boolean; message: string }>>(
      `/customer/tokens/${code}/select`,
      { crossCouponId }
    );
    return response.data;
  },

  getTokenInfo: async (code: string) => {
    const response = await api.get<ApiResponse<MealToken>>(`/customer/tokens/${code}`);
    return response.data;
  },
};

// Types
export interface Coupon {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  availableDays: number[];
  availableTimeStart?: string;
  availableTimeEnd?: string;
  status: string;
  store: {
    id: string;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    category: { name: string; icon: string };
    logoUrl?: string;
  };
}

export interface SavedCoupon {
  id: string;
  couponId: string;
  customerId: string;
  status: 'SAVED' | 'USED' | 'EXPIRED';
  acquiredAt: string;
  usedAt?: string;
  coupon: Coupon;
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: string;
  longitude: string;
  category: { id: string; name: string; icon: string };
  coupons: Coupon[];
}

export interface FavoriteStore {
  id: string;
  addedAt: string;
  store: {
    id: string;
    name: string;
    description?: string;
    address: string;
    latitude: string;
    longitude: string;
    logoUrl?: string;
    category: { id: string; name: string; icon?: string };
    activeCoupons: number;
  };
}

export interface CustomerProfile {
  id: string;
  nickname?: string;
  phone?: string;
  statsCouponsSaved: number;
  statsCouponsUsed: number;
  statsTotalSavedAmount: number;
  createdAt: string;
  isAnonymous: boolean;
  favoriteCount: number;
  savedCouponCount: number;
}

export interface CrossCouponOption {
  id: string;
  name: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  redemptionWindow: string;
  availableTimeStart?: string;
  availableTimeEnd?: string;
  providerStore: {
    id: string;
    name: string;
    category: { id: string; name: string } | null;
    address: string;
  };
}

export interface MealToken {
  id: string;
  tokenCode: string;
  status: 'ISSUED' | 'SELECTED' | 'REDEEMED' | 'EXPIRED';
  expiresAt: string;
  partnership: {
    distributorStore: { id: string; name: string };
    providerStore: { id: string; name: string };
  };
  selectedCrossCoupon?: {
    id: string;
    name: string;
    discountType: string;
    discountValue: number;
  };
}

export interface MapCoupon {
  id: string;
  name: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  store: {
    id: string;
    name: string;
    latitude: string;
    longitude: string;
    category: { name: string; icon: string };
  };
}
