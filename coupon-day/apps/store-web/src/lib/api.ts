import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/store/refresh`, {
            refreshToken,
          });

          const { accessToken: newAccessToken } = response.data.data;
          setAccessToken(newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return api(originalRequest);
        }
      } catch {
        // Refresh failed, redirect to login
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API response type
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth API
export const authApi = {
  login: async (phone: string, password: string) => {
    const response = await api.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      store: { id: string; name: string };
      account: { id: string; ownerName: string };
    }>>('/auth/store/login', { phone, password });
    return response.data;
  },

  register: async (data: {
    businessNumber: string;
    phone: string;
    password: string;
    ownerName: string;
    storeName: string;
    categoryId: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    const response = await api.post<ApiResponse<{
      accessToken: string;
      refreshToken: string;
      store: { id: string; name: string };
    }>>('/auth/store/register', data);
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post<ApiResponse<{
      accessToken: string;
    }>>('/auth/store/refresh', { refreshToken });
    return response.data;
  },
};

// Store API
export const storeApi = {
  getMe: async () => {
    const response = await api.get<ApiResponse<Store>>('/store/me');
    return response.data;
  },

  updateMe: async (data: Partial<Store>) => {
    const response = await api.patch<ApiResponse<Store>>('/store/me', data);
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get<ApiResponse<Dashboard>>('/store/me/dashboard');
    return response.data;
  },
};

// Coupon API
export const couponApi = {
  getAll: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get<ApiResponse<Coupon[]>>('/store/me/coupons', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Coupon>>(`/store/me/coupons/${id}`);
    return response.data;
  },

  create: async (data: CreateCouponInput) => {
    const response = await api.post<ApiResponse<Coupon>>('/store/me/coupons', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCouponInput>) => {
    const response = await api.patch<ApiResponse<Coupon>>(`/store/me/coupons/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: CouponStatus) => {
    const response = await api.patch<ApiResponse<Coupon>>(`/store/me/coupons/${id}/status`, { status });
    return response.data;
  },

  getPerformance: async (id: string) => {
    const response = await api.get<ApiResponse<CouponPerformance>>(`/store/me/coupons/${id}/performance`);
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get<ApiResponse<CouponRecommendation[]>>('/store/me/coupons/recommendations');
    return response.data;
  },
};

// Item API
export const itemApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Item[]>>('/store/me/items');
    return response.data;
  },

  create: async (data: CreateItemInput) => {
    const response = await api.post<ApiResponse<Item>>('/store/me/items', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateItemInput>) => {
    const response = await api.patch<ApiResponse<Item>>(`/store/me/items/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/store/me/items/${id}`);
    return response.data;
  },
};

// Types
export interface Store {
  id: string;
  businessNumber: string;
  name: string;
  description?: string;
  categoryId: string;
  address: string;
  latitude: string;
  longitude: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isVerified: boolean;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

export interface Dashboard {
  todaySales: number;
  todayRedemptions: number;
  activeCoupons: number;
  recommendations: CouponRecommendation[];
}

export interface Coupon {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  targetScope: 'ALL' | 'SPECIFIC';
  validFrom: string;
  validUntil: string;
  availableDays: number[];
  availableTimeStart?: string;
  availableTimeEnd?: string;
  totalQuantity?: number;
  dailyLimit?: number;
  perUserLimit?: number;
  status: CouponStatus;
  statsIssued: number;
  statsRedeemed: number;
  statsRedemptionRate: string;
}

export type CouponStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'DELETED';

export interface CreateCouponInput {
  name: string;
  description?: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  targetScope: 'ALL' | 'SPECIFIC';
  targetItems?: string[];
  validFrom: string;
  validUntil: string;
  availableDays: number[];
  availableTimeStart?: string;
  availableTimeEnd?: string;
  totalQuantity?: number;
  dailyLimit?: number;
  perUserLimit?: number;
}

export interface CouponPerformance {
  roi: number;
  totalRedemptions: number;
  totalSales: number;
  averageOrderValue: number;
  dailyStats: {
    date: string;
    redemptions: number;
    sales: number;
  }[];
}

export interface CouponRecommendation {
  type: string;
  title: string;
  description: string;
  expectedImpact: string;
  template: Partial<CreateCouponInput>;
}

export interface Item {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  cost?: number;
  isAvailable: boolean;
  isPopular: boolean;
}

export interface CreateItemInput {
  name: string;
  description?: string;
  category: string;
  price: number;
  cost?: number;
  isAvailable?: boolean;
  isPopular?: boolean;
}

// Partnership API
export const partnershipApi = {
  getAll: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get<ApiResponse<Partnership[]>>('/store/me/partnerships', { params });
    return response.data;
  },

  getRecommendations: async (role: 'provider' | 'distributor' = 'provider', limit: number = 10) => {
    const response = await api.get<ApiResponse<PartnerRecommendation[]>>(
      '/store/me/partnerships/recommendations',
      { params: { role, limit } }
    );
    return response.data;
  },

  request: async (targetStoreId: string) => {
    const response = await api.post<ApiResponse<Partnership>>('/store/me/partnerships/requests', {
      targetStoreId,
    });
    return response.data;
  },

  respond: async (id: string, accept: boolean) => {
    const response = await api.patch<ApiResponse<Partnership>>(
      `/store/me/partnerships/requests/${id}`,
      { accept }
    );
    return response.data;
  },
};

export interface Partnership {
  id: string;
  distributorStoreId: string;
  providerStoreId: string;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'TERMINATED';
  commissionPerRedemption: number;
  statsTokensIssued: number;
  statsCouponsSelected: number;
  statsRedemptions: number;
  requestedAt: string;
  distributorStore?: Store;
  providerStore?: Store;
}

export interface PartnerRecommendation {
  store: Store;
  score: number;
  reasons: string[];
  distance?: number;
}
