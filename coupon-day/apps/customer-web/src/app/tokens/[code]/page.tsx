'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Gift,
  Check,
  ChevronRight,
  AlertCircle,
  Store,
} from 'lucide-react';
import { tokenApi, MealToken, CrossCouponOption } from '@/lib/api';
import { clsx } from 'clsx';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import Link from 'next/link';

export default function TokenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tokenCode = params.code as string;
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ['token', tokenCode],
    queryFn: () => tokenApi.getTokenInfo(tokenCode),
  });

  const { data: couponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['token-coupons', tokenCode],
    queryFn: () => tokenApi.getAvailableCoupons(tokenCode),
    enabled: tokenData?.data?.status === 'ISSUED',
  });

  const selectCoupon = useMutation({
    mutationFn: (crossCouponId: string) => tokenApi.selectCoupon(tokenCode, crossCouponId),
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['token', tokenCode] });
      queryClient.invalidateQueries({ queryKey: ['my-tokens'] });
    },
  });

  const token = tokenData?.data;
  const availableCoupons = couponsData?.data || [];
  const isLoading = tokenLoading || couponsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="h-12 bg-white" />
        <div className="p-4 space-y-4">
          <div className="h-32 bg-secondary-200 rounded-2xl animate-pulse" />
          <div className="h-48 bg-secondary-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-500">토큰을 찾을 수 없습니다</p>
          <button
            onClick={() => router.push('/tokens')}
            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl"
          >
            토큰 목록으로
          </button>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(token.expiresAt);
  const hoursLeft = differenceInHours(expiresAt, new Date());
  const minutesLeft = differenceInMinutes(expiresAt, new Date());
  const isExpired = token.status === 'EXPIRED';
  const isRedeemed = token.status === 'REDEEMED';
  const isSelected = token.status === 'SELECTED';
  const canSelect = token.status === 'ISSUED';

  // Success Modal
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-secondary-900 mb-2">쿠폰 선택 완료!</h2>
          <p className="text-secondary-600 mb-6">
            선택한 쿠폰은 내 쿠폰함에서 확인할 수 있어요
          </p>
          <div className="space-y-3">
            <Link
              href="/wallet"
              className="block w-full py-3 bg-primary-500 text-white font-semibold rounded-xl"
            >
              쿠폰함 보기
            </Link>
            <button
              onClick={() => router.push('/tokens')}
              className="block w-full py-3 bg-secondary-100 text-secondary-700 font-medium rounded-xl"
            >
              토큰 목록으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 pb-32">
      {/* Header */}
      <header
        className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-30 border-b border-secondary-100"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-secondary-700" />
        </button>
        <h1 className="flex-1 font-semibold text-secondary-900">토큰 상세</h1>
      </header>

      {/* Token Info Card */}
      <div className="p-4">
        <div
          className={clsx(
            'bg-white rounded-2xl overflow-hidden border',
            isExpired || isRedeemed ? 'border-secondary-200' : 'border-secondary-100'
          )}
        >
          {/* Status Banner */}
          {(isExpired || isRedeemed) && (
            <div
              className={clsx(
                'text-center py-2 font-medium text-sm',
                isExpired ? 'bg-red-50 text-red-500' : 'bg-secondary-100 text-secondary-500'
              )}
            >
              {isExpired ? '기간 만료' : '사용 완료'}
            </div>
          )}

          {/* Token Header */}
          <div className="p-4 border-b border-secondary-100">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  canSelect ? 'bg-primary-100' : 'bg-secondary-100'
                )}
              >
                <Gift className={clsx('w-6 h-6', canSelect ? 'text-primary-500' : 'text-secondary-400')} />
              </div>
              <div>
                <p className="text-sm text-secondary-500">발급 매장</p>
                <p className="font-semibold text-secondary-900">
                  {token.partnership.distributorStore.name}
                </p>
              </div>
            </div>

            {/* Timer */}
            {canSelect && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-secondary-400" />
                <span className={clsx(hoursLeft < 2 ? 'text-red-500 font-medium' : 'text-secondary-600')}>
                  {hoursLeft > 0 ? `${hoursLeft}시간 후 만료` : `${minutesLeft}분 후 만료`}
                </span>
              </div>
            )}
          </div>

          {/* Partner Store */}
          <div className="p-4 bg-secondary-50">
            <p className="text-sm text-secondary-500 mb-2">선택 가능 파트너</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-secondary-400" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">
                  {token.partnership.providerStore.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Coupon (if already selected) */}
      {isSelected && token.selectedCrossCoupon && (
        <div className="px-4 mt-2">
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-semibold text-secondary-900 mb-3">선택한 쿠폰</h3>
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="font-semibold text-secondary-900">{token.selectedCrossCoupon.name}</p>
              <p className="text-lg font-bold text-primary-500 mt-1">
                {token.selectedCrossCoupon.discountType === 'FIXED'
                  ? `${token.selectedCrossCoupon.discountValue.toLocaleString()}원 할인`
                  : `${token.selectedCrossCoupon.discountValue}% 할인`}
              </p>
            </div>
            <Link
              href="/wallet"
              className="flex items-center justify-center gap-2 mt-4 w-full py-3 bg-primary-500 text-white font-semibold rounded-xl"
            >
              쿠폰함에서 보기
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {/* Available Coupons (if can select) */}
      {canSelect && (
        <div className="px-4 mt-2">
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-semibold text-secondary-900 mb-3">
              쿠폰 선택하기
              <span className="text-sm font-normal text-secondary-500 ml-2">
                ({availableCoupons.length}개)
              </span>
            </h3>

            {availableCoupons.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-secondary-300 mx-auto mb-2" />
                <p className="text-secondary-500">선택 가능한 쿠폰이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableCoupons.map((coupon) => (
                  <CouponOptionCard
                    key={coupon.id}
                    coupon={coupon}
                    isSelected={selectedCouponId === coupon.id}
                    onSelect={() => setSelectedCouponId(coupon.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      {canSelect && selectedCouponId && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-100 p-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          <button
            onClick={() => selectCoupon.mutate(selectedCouponId)}
            disabled={selectCoupon.isPending}
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg transition-all',
              'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]',
              selectCoupon.isPending && 'opacity-70 cursor-not-allowed'
            )}
          >
            {selectCoupon.isPending ? '선택 중...' : '이 쿠폰 선택하기'}
          </button>
        </div>
      )}
    </div>
  );
}

function CouponOptionCard({
  coupon,
  isSelected,
  onSelect,
}: {
  coupon: CrossCouponOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full p-4 rounded-xl border-2 text-left transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-secondary-100 bg-white hover:border-secondary-200'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Radio */}
        <div
          className={clsx(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
            isSelected ? 'border-primary-500 bg-primary-500' : 'border-secondary-300'
          )}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-secondary-900">{coupon.name}</h4>
          <p className="text-lg font-bold text-primary-500 mt-1">
            {coupon.discountType === 'FIXED'
              ? `${coupon.discountValue.toLocaleString()}원 할인`
              : `${coupon.discountValue}% 할인`}
          </p>
          {coupon.description && (
            <p className="text-sm text-secondary-500 mt-1">{coupon.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-secondary-400">
            <Clock className="w-3 h-3" />
            <span>유효기간: {coupon.redemptionWindow}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
