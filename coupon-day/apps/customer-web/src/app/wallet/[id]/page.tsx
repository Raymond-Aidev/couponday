'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { couponApi, SavedCoupon } from '@/lib/api';
import { clsx } from 'clsx';
import { format, differenceInDays, differenceInHours, differenceInSeconds } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WalletCouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const savedCouponId = params.id as string;
  const [qrTimeLeft, setQrTimeLeft] = useState<number | null>(null);

  // 쿠폰 목록 조회
  const { data: couponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['my-coupons'],
    queryFn: () => couponApi.getMySavedCoupons(),
  });

  const savedCoupon = couponsData?.data?.find((c) => c.id === savedCouponId);
  const coupon = savedCoupon?.coupon;
  const isUsed = savedCoupon?.status === 'USED';
  const isExpired = savedCoupon?.status === 'EXPIRED';
  const canShowQR = savedCoupon && savedCoupon.status === 'SAVED';

  // QR 코드 조회 (서버에서 서명된 QR 생성)
  const {
    data: qrData,
    isLoading: qrLoading,
    refetch: refetchQR,
    isRefetching,
  } = useQuery({
    queryKey: ['coupon-qr', savedCouponId],
    queryFn: () => couponApi.getSavedCouponQR(savedCouponId),
    enabled: canShowQR,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
    refetchInterval: 5 * 60 * 1000, // 5분마다 갱신
  });

  // QR 만료 카운트다운
  useEffect(() => {
    if (!qrData?.data?.expiresAt) {
      setQrTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const expiresAt = new Date(qrData.data.expiresAt);
      const seconds = differenceInSeconds(expiresAt, new Date());
      setQrTimeLeft(Math.max(0, seconds));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrData?.data?.expiresAt]);

  const isLoading = couponsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="h-12 bg-white" />
        <div className="p-4 space-y-4">
          <div className="h-64 bg-secondary-200 rounded-2xl animate-pulse" />
          <div className="h-40 bg-secondary-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!savedCoupon || !coupon) {
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

  const validUntil = new Date(coupon.validUntil);
  const daysLeft = differenceInDays(validUntil, new Date());
  const hoursLeft = differenceInHours(validUntil, new Date());
  const isExpiringSoon = daysLeft < 3 && daysLeft >= 0;

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const availableDaysText =
    coupon.availableDays?.length === 7
      ? '매일'
      : coupon.availableDays?.map((d) => dayNames[d]).join(', ') || '매일';

  // QR 남은 시간 포맷
  const formatQrTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-secondary-50 pb-8">
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
        <h1 className="flex-1 font-semibold text-secondary-900">쿠폰 사용</h1>
      </header>

      {/* QR Code Card */}
      <div className="p-4">
        <div
          className={clsx(
            'coupon-card bg-white border overflow-hidden',
            isUsed || isExpired ? 'border-secondary-200' : 'border-secondary-100'
          )}
        >
          {/* Status Badge */}
          {(isUsed || isExpired) && (
            <div
              className={clsx(
                'text-center py-2 font-medium text-sm',
                isUsed ? 'bg-secondary-100 text-secondary-500' : 'bg-red-50 text-red-500'
              )}
            >
              {isUsed ? '사용 완료' : '기간 만료'}
            </div>
          )}

          {/* Top Info */}
          <div className="p-4 text-center border-b border-dashed border-secondary-200">
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-600 text-xs font-medium rounded-full">
              {coupon.store?.category?.name || '음식점'}
            </span>
            <h2 className="text-lg font-bold text-secondary-900 mt-2">{coupon.store?.name}</h2>
          </div>

          {/* QR Code */}
          <div className="p-8 flex flex-col items-center justify-center bg-secondary-50">
            {isUsed || isExpired ? (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-secondary-100 rounded-xl">
                <p className="text-secondary-400 text-center">
                  {isUsed ? '이미 사용된 쿠폰입니다' : '만료된 쿠폰입니다'}
                </p>
              </div>
            ) : qrLoading || isRefetching ? (
              <div className="w-[250px] h-[250px] bg-secondary-200 rounded-xl animate-pulse flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-secondary-400 animate-spin" />
              </div>
            ) : qrData?.data?.qrCode ? (
              <>
                <img
                  src={qrData.data.qrCode}
                  alt="쿠폰 QR 코드"
                  className="w-[250px] h-[250px] rounded-xl shadow-sm"
                />
                <p className="text-sm text-secondary-500 mt-4">
                  점원에게 QR 코드를 보여주세요
                </p>

                {/* QR 만료 타이머 */}
                {qrTimeLeft !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary-400" />
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        qrTimeLeft < 60 ? 'text-red-500' : 'text-secondary-500'
                      )}
                    >
                      QR 유효: {formatQrTimeLeft(qrTimeLeft)}
                    </span>
                    <button
                      onClick={() => refetchQR()}
                      className="p-1 hover:bg-secondary-200 rounded-full transition-colors"
                      title="QR 새로고침"
                    >
                      <RefreshCw className="w-4 h-4 text-secondary-400" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-secondary-100 rounded-xl">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                  <p className="text-secondary-500 text-sm">QR 코드를 불러올 수 없습니다</p>
                  <button
                    onClick={() => refetchQR()}
                    className="mt-2 px-4 py-2 bg-primary-500 text-white text-sm rounded-lg"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Discount Info */}
          <div className="p-4 bg-white text-center border-t border-dashed border-secondary-200">
            <h3 className="font-semibold text-secondary-900">{coupon.name}</h3>
            <p
              className={clsx(
                'text-3xl font-bold mt-2',
                isUsed || isExpired ? 'text-secondary-400' : 'text-primary-500'
              )}
            >
              {coupon.discountType === 'FIXED'
                ? `${coupon.discountValue.toLocaleString()}원`
                : `${coupon.discountValue}%`}
              <span className="text-lg font-normal ml-1">할인</span>
            </p>
          </div>

          {/* Expiry Warning */}
          {!isUsed && !isExpired && isExpiringSoon && (
            <div className="px-4 py-3 bg-red-50 text-red-600 text-center text-sm font-medium flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              {daysLeft > 0 ? `${daysLeft}일 후 만료` : `${hoursLeft}시간 후 만료`}
            </div>
          )}
        </div>
      </div>

      {/* Coupon Details */}
      <div className="px-4 mt-2">
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-semibold text-secondary-900 mb-3">쿠폰 정보</h3>

          <div className="space-y-3">
            {/* Validity Period */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-500">유효기간</p>
                <p className="text-secondary-900">
                  ~{format(validUntil, 'yyyy.M.d', { locale: ko })}
                </p>
              </div>
            </div>

            {/* Available Days */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-secondary-500">사용 가능일</p>
                <p className="text-secondary-900">{availableDaysText}</p>
                {coupon.availableTimeStart && coupon.availableTimeEnd && (
                  <p className="text-secondary-600 text-sm">
                    {coupon.availableTimeStart} ~ {coupon.availableTimeEnd}
                  </p>
                )}
              </div>
            </div>

            {/* Used At */}
            {isUsed && savedCoupon.usedAt && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-secondary-500">사용 일시</p>
                  <p className="text-secondary-900">
                    {format(new Date(savedCoupon.usedAt), 'yyyy.M.d HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="px-4 mt-2">
        <Link
          href={`/stores/${coupon.storeId}`}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">{coupon.store?.category?.icon || '🍽️'}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-secondary-900">{coupon.store?.name}</p>
            <p className="text-sm text-secondary-500 truncate">{coupon.store?.address}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary-400" />
        </Link>
      </div>

      {/* Map Button */}
      {coupon.store && (
        <div className="px-4 mt-2">
          <button
            onClick={() => {
              const url = `https://map.kakao.com/link/map/${coupon.store?.name},${coupon.store?.latitude},${coupon.store?.longitude}`;
              window.open(url, '_blank');
            }}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl text-primary-500 font-medium"
          >
            <MapPin className="w-5 h-5" />
            지도에서 위치 보기
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
