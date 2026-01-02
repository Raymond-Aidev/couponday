'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  MapPin,
  Phone,
  Clock,
  Link2,
  Ticket,
  TrendingUp,
  MoreVertical,
  Pause,
  Play,
  X,
  Plus,
  AlertCircle,
  Users,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { partnershipApi, Partnership, storeApi } from '@/lib/api';
import { clsx } from 'clsx';

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const partnerId = params.id as string;

  const [showMenu, setShowMenu] = useState(false);

  // Fetch my store info
  const { data: myStore } = useQuery({
    queryKey: ['store', 'me'],
    queryFn: async () => {
      const response = await storeApi.getMe();
      return response.data;
    },
  });

  // Fetch partnership details
  const { data: partnership, isLoading, error } = useQuery({
    queryKey: ['partnership', partnerId],
    queryFn: async () => {
      const response = await partnershipApi.getById(partnerId);
      return response.data;
    },
  });

  // Get partner store (the one that is NOT my store)
  const getPartnerStore = () => {
    if (!partnership || !myStore) return null;
    if (partnership.distributorStoreId === myStore.id) {
      return partnership.providerStore;
    }
    return partnership.distributorStore;
  };

  const partnerStore = getPartnerStore();
  const crossCoupons = partnership?.crossCoupons || [];

  const conversionRate = partnership && partnership.statsTokensIssued > 0
    ? ((partnership.statsRedemptions / partnership.statsTokensIssued) * 100).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !partnership) {
    return (
      <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-secondary-600 text-center">파트너십을 불러오는데 실패했습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-secondary-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-secondary-600" />
          </button>
          <h1 className="text-lg font-semibold text-secondary-900">파트너 상세</h1>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2"
            >
              <MoreVertical className="w-6 h-6 text-secondary-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-secondary-100 overflow-hidden z-20">
                  {partnership.status === 'ACTIVE' ? (
                    <button className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 w-full">
                      <Pause className="w-5 h-5 text-yellow-500" />
                      <span className="text-secondary-700">일시정지</span>
                    </button>
                  ) : (
                    <button className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 w-full">
                      <Play className="w-5 h-5 text-green-500" />
                      <span className="text-secondary-700">재개하기</span>
                    </button>
                  )}
                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 w-full">
                    <X className="w-5 h-5 text-red-500" />
                    <span className="text-red-600">제휴 종료</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Partner Store Info */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">{partnerStore?.category?.icon || '🏪'}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={clsx(
                    'px-2 py-0.5 text-xs font-medium rounded-full',
                    partnership.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-600'
                      : partnership.status === 'PAUSED'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-secondary-100 text-secondary-600'
                  )}
                >
                  {partnership.status === 'ACTIVE' ? '제휴중' : partnership.status === 'PAUSED' ? '일시정지' : '종료'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-secondary-900">
                {partnerStore?.name}
              </h2>
              <p className="text-sm text-secondary-500">
                {partnerStore?.category?.name}
              </p>
            </div>
          </div>

          {partnerStore?.description && (
            <p className="mt-4 text-sm text-secondary-600">
              {partnerStore.description}
            </p>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <MapPin className="w-4 h-4" />
              <span>{partnerStore?.address}</span>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>제휴 성과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-secondary-50 rounded-xl">
                <p className="text-2xl font-bold text-secondary-900">
                  {partnership.statsTokensIssued}
                </p>
                <p className="text-xs text-secondary-500">토큰 발급</p>
              </div>
              <div className="text-center p-3 bg-secondary-50 rounded-xl">
                <p className="text-2xl font-bold text-secondary-900">
                  {partnership.statsRedemptions}
                </p>
                <p className="text-xs text-secondary-500">쿠폰 사용</p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-xl">
                <p className="text-2xl font-bold text-primary-600">
                  {conversionRate}%
                </p>
                <p className="text-xs text-secondary-500">전환율</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    예상 커미션 수익
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-700">
                  {(partnership.statsRedemptions * partnership.commissionPerRedemption).toLocaleString()}원
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                사용건당 {partnership.commissionPerRedemption.toLocaleString()}원
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cross Coupons */}
        <Card>
          <CardHeader>
            <CardTitle>크로스 쿠폰</CardTitle>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </CardHeader>
          <CardContent>
            {crossCoupons.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">등록된 크로스 쿠폰이 없어요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {crossCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={clsx(
                      'p-3 border rounded-xl',
                      coupon.isActive
                        ? 'border-secondary-200 bg-white'
                        : 'border-secondary-100 bg-secondary-50 opacity-60'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-secondary-900">
                        {coupon.name}
                      </h4>
                      <span
                        className={clsx(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          coupon.isActive
                            ? 'bg-green-100 text-green-600'
                            : 'bg-secondary-100 text-secondary-500'
                        )}
                      >
                        {coupon.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                    <p className="text-sm text-primary-500 font-medium mb-2">
                      {coupon.discountType === 'FIXED'
                        ? `${coupon.discountValue.toLocaleString()}원 할인`
                        : `${coupon.discountValue}% 할인`}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-secondary-500">
                      <span>선택 {coupon.statsSelected}</span>
                      <span>사용 {coupon.statsRedeemed}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement Info */}
        <Card>
          <CardHeader>
            <CardTitle>정산 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-secondary-100">
                <span className="text-sm text-secondary-600">정산 주기</span>
                <span className="font-medium text-secondary-900">월별</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-secondary-100">
                <span className="text-sm text-secondary-600">건당 커미션</span>
                <span className="font-medium text-secondary-900">
                  {partnership.commissionPerRedemption.toLocaleString()}원
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-secondary-600">이번 달 정산 예정</span>
                <span className="font-bold text-primary-600">
                  {(partnership.statsRedemptions * partnership.commissionPerRedemption).toLocaleString()}원
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
