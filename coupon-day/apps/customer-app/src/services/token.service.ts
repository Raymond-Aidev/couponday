import api from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse, CrossCouponOption } from '../types';

export const tokenService = {
  /**
   * Get available cross coupons for a token
   */
  async getAvailableCoupons(tokenCode: string): Promise<CrossCouponOption[]> {
    const response = await api.get<ApiResponse<CrossCouponOption[]>>(
      API_ENDPOINTS.TOKENS.AVAILABLE(tokenCode)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '사용 가능한 쿠폰을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Select a cross coupon
   */
  async selectCoupon(
    tokenCode: string,
    crossCouponId: string
  ): Promise<{
    success: boolean;
    crossCoupon: CrossCouponOption;
    message: string;
  }> {
    const response = await api.post<ApiResponse<{
      success: boolean;
      crossCoupon: CrossCouponOption;
      message: string;
    }>>(
      API_ENDPOINTS.TOKENS.SELECT(tokenCode),
      { crossCouponId }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰 선택에 실패했습니다');
    }

    return response.data.data;
  },
};
