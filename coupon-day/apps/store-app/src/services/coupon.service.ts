import api from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse, Coupon, CouponCreateInput, CouponStatus } from '../types';

export interface CouponPerformance {
  couponId: string;
  period: {
    start: string;
    end: string;
  };
  baseline: {
    averageDailySales: number;
    averageDailyCustomers: number;
  };
  performance: {
    totalRedemptions: number;
    totalRevenue: number;
    averageDailySales: number;
    averageDailyCustomers: number;
  };
  roi: {
    incrementalRevenue: number;
    totalDiscountGiven: number;
    netImpact: number;
    roiPercentage: number;
  };
  dailyStats: Array<{
    date: string;
    redemptions: number;
    revenue: number;
  }>;
}

export const couponService = {
  /**
   * Get all coupons
   */
  async getCoupons(status?: CouponStatus): Promise<Coupon[]> {
    const params = status ? { status } : {};
    const response = await api.get<ApiResponse<Coupon[]>>(
      API_ENDPOINTS.COUPONS.LIST,
      { params }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰 목록을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get coupon by ID
   */
  async getCoupon(id: string): Promise<Coupon> {
    const response = await api.get<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.DETAIL(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Create new coupon
   */
  async createCoupon(input: CouponCreateInput): Promise<Coupon> {
    const response = await api.post<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.CREATE,
      input
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰 생성에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * Update coupon
   */
  async updateCoupon(id: string, input: Partial<CouponCreateInput>): Promise<Coupon> {
    const response = await api.patch<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.UPDATE(id),
      input
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰 수정에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * Update coupon status
   */
  async updateCouponStatus(id: string, status: CouponStatus): Promise<Coupon> {
    const response = await api.patch<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.STATUS(id),
      { status }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '상태 변경에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * Get coupon QR code
   */
  async getCouponQR(id: string): Promise<string> {
    const response = await api.get<ApiResponse<{ qrCode: string }>>(
      API_ENDPOINTS.COUPONS.QR(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'QR 코드를 가져올 수 없습니다');
    }

    return response.data.data.qrCode;
  },

  /**
   * Get coupon performance
   */
  async getCouponPerformance(id: string): Promise<CouponPerformance> {
    const response = await api.get<ApiResponse<CouponPerformance>>(
      API_ENDPOINTS.COUPONS.PERFORMANCE(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '성과 데이터를 가져올 수 없습니다');
    }

    return response.data.data;
  },
};
