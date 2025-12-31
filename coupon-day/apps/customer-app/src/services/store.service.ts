import api from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse, Store, Location } from '../types';

export interface StoreSearchParams {
  query?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export const storeService = {
  /**
   * Search stores
   */
  async searchStores(params: StoreSearchParams): Promise<Store[]> {
    const response = await api.get<ApiResponse<Store[]>>(
      API_ENDPOINTS.STORES.SEARCH,
      { params }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '가게 목록을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get store details
   */
  async getStore(id: string, location?: Location): Promise<Store> {
    const response = await api.get<ApiResponse<Store>>(
      API_ENDPOINTS.STORES.DETAIL(id),
      {
        params: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
        } : undefined,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '가게 정보를 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Toggle favorite store
   */
  async toggleFavorite(id: string): Promise<{ isFavorite: boolean }> {
    const response = await api.post<ApiResponse<{ isFavorite: boolean }>>(
      API_ENDPOINTS.STORES.FAVORITE(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '즐겨찾기 처리에 실패했습니다');
    }

    return response.data.data;
  },
};
