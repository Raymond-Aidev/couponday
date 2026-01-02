'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Share2,
  Check,
  AlertCircle,
  Store,
  ChevronRight,
} from 'lucide-react';
import { couponApi, storeApi, Coupon } from '@/lib/api';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';

export default function CouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const couponId = params.id as string;
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const { data: couponData, isLoading } = useQuery({
    queryKey: ['coupon', couponId],
    queryFn: () => couponApi.getById(couponId),
  });

  const saveCoupon = useMutation({
    mutationFn: () => couponApi.save(couponId),
    onSuccess: () => {
      setShowSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['coupon', couponId] });
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] });
      setTimeout(() => setShowSaveSuccess(false), 2000);
    },
  });

  const coupon = couponData?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="h-12 bg-white" />
        <div className="p-4 space-y-4">
          <div className="h-40 bg-secondary-200 rounded-2xl animate-pulse" />
          <div className="h-8 bg-secondary-200 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-secondary-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-500">쿠폰을 찾을 수 없습니다</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const validFrom = new Date(coupon.validFrom);
  const validUntil = new Date(coupon.validUntil);
  const isExpiringSoon = validUntil.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((validUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const availableDaysText =
    coupon.availableDays?.length === 7
      ? '매일'
      : coupon.availableDays?.map((d) => dayNames[d]).join(', ') || '매일';

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
        <h1 className="flex-1 font-semibold text-secondary-900">쿠폰 상세</h1>
        <button className="w-10 h-10 flex items-center justify-center -mr-2">
          <Share2 className="w-5 h-5 text-secondary-600" />
        </button>
      </header>

      {/* Coupon Card */}
      <div className="p-4">
        <div className="coupon-card bg-white border border-secondary-100 overflow-hidden">
          {/* Top - Discount Info */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white text-center">
            <p className="text-sm opacity-90 mb-1">{coupon.store?.name}</p>
            <h2 className="text-2xl font-bold">{coupon.name}</h2>
            <p className="text-4xl font-bold mt-3">
              {coupon.discountType === 'FIXED'
                ? `${coupon.discountValue.toLocaleString()}원`
                : `${coupon.discountValue}%`}
            </p>
            <p className="text-sm opacity-90 mt-1">할인</p>
          </div>

          {/* Bottom - Details */}
          <div className="p-4">
            {coupon.description && (
              <p className="text-secondary-600 text-sm mb-4">{coupon.description}</p>
            )}

            <div className="space-y-3">
              {/* Validity Period */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-secondary-500">유효기간</p>
                  <p className="text-secondary-900 font-medium">
                    {format(validFrom, 'yyyy.M.d', { locale: ko })} ~{' '}
                    {format(validUntil, 'yyyy.M.d', { locale: ko })}
                  </p>
                  {isExpiringSoon && (
                    <p className="text-red-500 text-sm font-medium mt-0.5">
                      {daysLeft}일 남음
                    </p>
                  )}
                </div>
              </div>

              {/* Available Days */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-secondary-500">사용 가능일</p>
                  <p className="text-secondary-900 font-medium">{availableDaysText}</p>
                  {coupon.availableTimeStart && coupon.availableTimeEnd && (
                    <p className="text-secondary-600 text-sm">
                      {coupon.availableTimeStart} ~ {coupon.availableTimeEnd}
                    </p>
                  )}
                </div>
              </div>

              {/* Store Info */}
              <Link
                href={`/stores/${coupon.storeId}`}
                className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-2xl">{coupon.store?.category?.icon || '🍽️'}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-secondary-900">{coupon.store?.name}</p>
                  <p className="text-sm text-secondary-500 truncate">{coupon.store?.address}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-secondary-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="px-4 mt-2">
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-semibold text-secondary-900 mb-3">유의사항</h3>
          <ul className="space-y-2 text-sm text-secondary-600">
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>본 쿠폰은 1회 사용 가능합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>다른 쿠폰과 중복 사용이 불가합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>유효기간이 지난 쿠폰은 사용할 수 없습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>매장 사정에 따라 사용이 제한될 수 있습니다.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Save Success Toast */}
      {showSaveSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-secondary-900 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
            <Check className="w-5 h-5 text-green-400" />
            <span>쿠폰이 저장되었습니다!</span>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-100 p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <button
          onClick={() => saveCoupon.mutate()}
          disabled={saveCoupon.isPending}
          className={clsx(
            'w-full py-4 rounded-2xl font-semibold text-lg transition-all',
            'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]',
            saveCoupon.isPending && 'opacity-70 cursor-not-allowed'
          )}
        >
          {saveCoupon.isPending ? '저장 중...' : '쿠폰 저장하기'}
        </button>
      </div>
    </div>
  );
}
