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

// Types
export interface Coupon {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENT';
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
