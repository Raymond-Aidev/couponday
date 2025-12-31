import api from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse, Coupon, SavedCoupon, MapMarker, CouponFilter, Location } from '../types';

export const couponService = {
  /**
   * Get nearby coupons
   */
  async getNearbyCoupons(
    location: Location,
    filter?: CouponFilter
  ): Promise<Coupon[]> {
    const response = await api.get<ApiResponse<Coupon[]>>(
      API_ENDPOINTS.COUPONS.NEARBY,
      {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          ...filter,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰 목록을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get coupons for map view
   */
  async getMapCoupons(
    location: Location,
    radius: number = 5000
  ): Promise<MapMarker[]> {
    const response = await api.get<ApiResponse<MapMarker[]>>(
      API_ENDPOINTS.COUPONS.MAP,
      {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '지도 데이터를 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get coupon details
   */
  async getCoupon(id: string): Promise<Coupon> {
    const response = await api.get<ApiResponse<Coupon>>(
      API_ENDPOINTS.COUPONS.DETAIL(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰 정보를 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Save coupon to wallet
   */
  async saveCoupon(id: string): Promise<SavedCoupon> {
    const response = await api.post<ApiResponse<SavedCoupon>>(
      API_ENDPOINTS.COUPONS.SAVE(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰 저장에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * Get my saved coupons
   */
  async getMyCoupons(): Promise<SavedCoupon[]> {
    const response = await api.get<ApiResponse<SavedCoupon[]>>(
      API_ENDPOINTS.COUPONS.MY_COUPONS
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '쿠폰함을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get QR code for saved coupon
   */
  async getCouponQR(id: string): Promise<string> {
    const response = await api.get<ApiResponse<{ qrCode: string }>>(
      API_ENDPOINTS.COUPONS.MY_COUPON_QR(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'QR 코드를 가져올 수 없습니다');
    }

    return response.data.data.qrCode;
  },
};
