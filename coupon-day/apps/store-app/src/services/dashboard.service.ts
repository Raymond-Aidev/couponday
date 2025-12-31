import api from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse, DashboardData, CouponRecommendation } from '../types';

export const dashboardService = {
  /**
   * Get dashboard data
   */
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get<ApiResponse<DashboardData>>(
      API_ENDPOINTS.STORE.DASHBOARD
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '대시보드 데이터를 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get AI coupon recommendations
   */
  async getRecommendations(): Promise<CouponRecommendation[]> {
    const response = await api.get<ApiResponse<CouponRecommendation[]>>(
      API_ENDPOINTS.COUPONS.RECOMMENDATIONS
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '추천을 가져올 수 없습니다');
    }

    return response.data.data;
  },
};
