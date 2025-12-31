import api, { setAuthTokens, clearAuthTokens } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse, AuthTokens, StoreUser, Store } from '../types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  businessNumber: string;
  phone: string;
  storeName: string;
  storeAddress: string;
  categoryId: string;
}

export interface LoginResponse {
  user: StoreUser;
  store: Store;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: StoreUser;
  store: Store;
  tokens: AuthTokens;
}

export const authService = {
  /**
   * Login store owner
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      input
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '로그인에 실패했습니다');
    }

    const { tokens, ...rest } = response.data.data;
    await setAuthTokens(tokens);

    return response.data.data;
  },

  /**
   * Register new store
   */
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const response = await api.post<ApiResponse<RegisterResponse>>(
      API_ENDPOINTS.AUTH.REGISTER,
      input
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '회원가입에 실패했습니다');
    }

    const { tokens } = response.data.data;
    await setAuthTokens(tokens);

    return response.data.data;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore logout API errors
    } finally {
      await clearAuthTokens();
    }
  },

  /**
   * Get current store info
   */
  async getMe(): Promise<{ user: StoreUser; store: Store }> {
    const response = await api.get<ApiResponse<{ user: StoreUser; store: Store }>>(
      API_ENDPOINTS.STORE.ME
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '정보를 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Verify business number (from 국세청 API)
   */
  async verifyBusinessNumber(businessNumber: string): Promise<{
    valid: boolean;
    companyName?: string;
  }> {
    const response = await api.post<ApiResponse<{ valid: boolean; companyName?: string }>>(
      '/auth/verify-business',
      { businessNumber }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '사업자번호 확인에 실패했습니다');
    }

    return response.data.data;
  },
};
