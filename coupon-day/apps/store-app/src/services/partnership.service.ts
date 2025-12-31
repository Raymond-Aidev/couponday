import api from './api';
import { API_ENDPOINTS } from '../constants/api';
import {
  ApiResponse,
  Partnership,
  PartnerRecommendation,
  CrossCoupon,
  Settlement,
  MealToken,
} from '../types';

export interface PartnershipRequest {
  id: string;
  fromStore: { id: string; name: string; category: { name: string } };
  toStore: { id: string; name: string; category: { name: string } };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  createdAt: string;
}

export const partnershipService = {
  /**
   * Get all partnerships
   */
  async getPartnerships(): Promise<Partnership[]> {
    const response = await api.get<ApiResponse<Partnership[]>>(
      API_ENDPOINTS.PARTNERSHIPS.LIST
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '파트너십 목록을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get partnership recommendations
   */
  async getRecommendations(): Promise<PartnerRecommendation[]> {
    const response = await api.get<ApiResponse<PartnerRecommendation[]>>(
      API_ENDPOINTS.PARTNERSHIPS.RECOMMENDATIONS
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '추천 목록을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get partnership requests
   */
  async getRequests(): Promise<PartnershipRequest[]> {
    const response = await api.get<ApiResponse<PartnershipRequest[]>>(
      API_ENDPOINTS.PARTNERSHIPS.REQUESTS
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '요청 목록을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Send partnership request
   */
  async sendRequest(toStoreId: string, message?: string): Promise<PartnershipRequest> {
    const response = await api.post<ApiResponse<PartnershipRequest>>(
      API_ENDPOINTS.PARTNERSHIPS.REQUESTS,
      { toStoreId, message }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '요청 전송에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * Respond to partnership request
   */
  async respondToRequest(
    requestId: string,
    action: 'accept' | 'reject'
  ): Promise<PartnershipRequest> {
    const response = await api.patch<ApiResponse<PartnershipRequest>>(
      API_ENDPOINTS.PARTNERSHIPS.RESPOND(requestId),
      { action }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '응답 처리에 실패했습니다');
    }

    return response.data.data;
  },

  /**
   * Get partnership details
   */
  async getPartnership(id: string): Promise<Partnership> {
    const response = await api.get<ApiResponse<Partnership>>(
      API_ENDPOINTS.PARTNERSHIPS.DETAIL(id)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '파트너십 정보를 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Get cross coupons for partnership
   */
  async getCrossCoupons(): Promise<CrossCoupon[]> {
    const response = await api.get<ApiResponse<CrossCoupon[]>>(
      API_ENDPOINTS.CROSS_COUPONS.LIST
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '크로스쿠폰 목록을 가져올 수 없습니다');
    }

    return response.data.data;
  },

  /**
   * Issue meal token
   */
  async issueMealToken(partnershipId: string): Promise<MealToken> {
    const response = await api.post<ApiResponse<{ token: MealToken; code: string }>>(
      API_ENDPOINTS.MEAL_TOKENS.ISSUE,
      { partnershipId }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '토큰 발급에 실패했습니다');
    }

    return response.data.data.token;
  },

  /**
   * Get settlements
   */
  async getSettlements(partnershipId: string): Promise<Settlement[]> {
    const response = await api.get<ApiResponse<{ settlements: Settlement[] }>>(
      API_ENDPOINTS.PARTNERSHIPS.SETTLEMENTS(partnershipId)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '정산 내역을 가져올 수 없습니다');
    }

    return response.data.data.settlements;
  },
};
