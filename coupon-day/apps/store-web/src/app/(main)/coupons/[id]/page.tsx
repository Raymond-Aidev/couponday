'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ChevronLeft,
  MoreVertical,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Ticket,
  Play,
  Pause,
  Trash2,
  Edit,
  QrCode,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { couponApi, Coupon, CouponStatus } from '@/lib/api';
import { clsx } from 'clsx';

const statusBadgeStyles: Record<CouponStatus, string> = {
  DRAFT: 'bg-secondary-100 text-secondary-600',
  SCHEDULED: 'bg-blue-100 text-blue-600',
  ACTIVE: 'bg-green-100 text-green-600',
  PAUSED: 'bg-yellow-100 text-yellow-600',
  ENDED: 'bg-secondary-100 text-secondary-500',
  DELETED: 'bg-red-100 text-red-600',
};

const statusLabels: Record<CouponStatus, string> = {
  DRAFT: '초안',
  SCHEDULED: '예약',
  ACTIVE: '운영중',
  PAUSED: '일시정지',
  ENDED: '종료',
  DELETED: '삭제됨',
};

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export default function CouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const couponId = params.id as string;

  const [showMenu, setShowMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const { data: couponData, isLoading, error } = useQuery({
    queryKey: ['coupon', couponId],
    queryFn: async () => {
      const response = await couponApi.getById(couponId);
      return response.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: CouponStatus) => couponApi.updateStatus(couponId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon', couponId] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const coupon = couponData;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !coupon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-secondary-300 mb-4" />
        <p className="text-secondary-500 mb-4">쿠폰을 찾을 수 없습니다</p>
        <Button onClick={() => router.back()}>돌아가기</Button>
      </div>
    );
  }

  const validFrom = new Date(coupon.validFrom);
  const validUntil = new Date(coupon.validUntil);
  const isExpired = validUntil < new Date();
  const redemptionRate = coupon.statsIssued > 0
    ? ((coupon.statsRedeemed / coupon.statsIssued) * 100).toFixed(1)
    : '0';

  const handleStatusChange = (newStatus: CouponStatus) => {
    statusMutation.mutate(newStatus);
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-secondary-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-secondary-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-secondary-600" />
          </button>
          <h1 className="text-lg font-semibold text-secondary-900">쿠폰 상세</h1>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2"
            >
              <MoreVertical className="w-6 h-6 text-secondary-600" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-secondary-100 overflow-hidden z-20">
                  <Link
                    href={`/coupons/${couponId}/edit`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-50"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit className="w-5 h-5 text-secondary-500" />
                    <span className="text-secondary-700">수정하기</span>
                  </Link>
                  {coupon.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleStatusChange('PAUSED')}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 w-full"
                    >
                      <Pause className="w-5 h-5 text-yellow-500" />
                      <span className="text-secondary-700">일시정지</span>
                    </button>
                  )}
                  {coupon.status === 'PAUSED' && (
                    <button
                      onClick={() => handleStatusChange('ACTIVE')}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 w-full"
                    >
                      <Play className="w-5 h-5 text-green-500" />
                      <span className="text-secondary-700">재개하기</span>
                    </button>
                  )}
                  {coupon.status !== 'ENDED' && (
                    <button
                      onClick={() => handleStatusChange('ENDED')}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 w-full"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <span className="text-red-600">종료하기</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status & Title Card */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <span
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-full',
                statusBadgeStyles[coupon.status]
              )}
            >
              {statusLabels[coupon.status]}
            </span>
            {isExpired && coupon.status !== 'ENDED' && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-600">
                기간 만료
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-secondary-900 mb-2">
            {coupon.name}
          </h2>

          <p className="text-2xl font-bold text-primary-500 mb-4">
            {coupon.discountType === 'FIXED'
              ? `${coupon.discountValue.toLocaleString()}원 할인`
              : `${coupon.discountValue}% 할인`}
          </p>

          {coupon.description && (
            <p className="text-secondary-600 text-sm">{coupon.description}</p>
          )}
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>통계</CardTitle>
            <Link href={`/coupons/${couponId}/performance`}>
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4 mr-1" />
                상세 분석
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-secondary-50 rounded-xl">
                <p className="text-2xl font-bold text-secondary-900">
                  {coupon.statsIssued}
                </p>
                <p className="text-xs text-secondary-500">발급</p>
              </div>
              <div className="text-center p-3 bg-secondary-50 rounded-xl">
                <p className="text-2xl font-bold text-secondary-900">
                  {coupon.statsRedeemed}
                </p>
                <p className="text-xs text-secondary-500">사용</p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-xl">
                <p className="text-2xl font-bold text-primary-600">
                  {redemptionRate}%
                </p>
                <p className="text-xs text-secondary-500">사용률</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions Card */}
        <Card>
          <CardHeader>
            <CardTitle>사용 조건</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Period */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">유효 기간</p>
                <p className="text-sm text-secondary-500">
                  {format(validFrom, 'yyyy.MM.dd', { locale: ko })} ~{' '}
                  {format(validUntil, 'yyyy.MM.dd', { locale: ko })}
                </p>
              </div>
            </div>

            {/* Days */}
            {coupon.availableDays && coupon.availableDays.length > 0 && coupon.availableDays.length < 7 && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-secondary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-700">사용 가능 요일</p>
                  <div className="flex gap-1 mt-1">
                    {dayLabels.map((day, index) => (
                      <span
                        key={day}
                        className={clsx(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs',
                          coupon.availableDays.includes(index)
                            ? 'bg-primary-500 text-white'
                            : 'bg-secondary-100 text-secondary-400'
                        )}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Time */}
            {(coupon.availableTimeStart || coupon.availableTimeEnd) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-secondary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-700">사용 가능 시간</p>
                  <p className="text-sm text-secondary-500">
                    {coupon.availableTimeStart || '00:00'} ~{' '}
                    {coupon.availableTimeEnd || '24:00'}
                  </p>
                </div>
              </div>
            )}

            {/* Limits */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">수량 제한</p>
                <p className="text-sm text-secondary-500">
                  {coupon.totalQuantity
                    ? `총 ${coupon.totalQuantity}개`
                    : '제한 없음'}
                  {coupon.dailyLimit && ` / 일 ${coupon.dailyLimit}개`}
                  {coupon.perUserLimit && ` / 1인 ${coupon.perUserLimit}회`}
                </p>
              </div>
            </div>

            {/* Target */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Ticket className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">적용 대상</p>
                <p className="text-sm text-secondary-500">
                  {coupon.targetScope === 'ALL' ? '전체 메뉴' : '특정 메뉴'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle>QR 코드</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowQR(!showQR)}
              leftIcon={<QrCode className="w-5 h-5" />}
            >
              {showQR ? 'QR 코드 숨기기' : 'QR 코드 보기'}
            </Button>

            {showQR && (
              <div className="mt-4 p-4 bg-white border border-secondary-200 rounded-xl text-center">
                <div className="w-48 h-48 bg-secondary-100 mx-auto rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-secondary-400" />
                </div>
                <p className="mt-3 text-sm text-secondary-500">
                  고객이 스캔하면 쿠폰을 저장할 수 있어요
                </p>
                <p className="mt-1 text-xs text-secondary-400 font-mono">
                  couponday://coupon/{couponId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions */}
      {coupon.status === 'DRAFT' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-secondary-100 safe-area-bottom">
          <Button
            fullWidth
            size="lg"
            onClick={() => handleStatusChange('ACTIVE')}
            isLoading={statusMutation.isPending}
          >
            쿠폰 활성화
          </Button>
        </div>
      )}
    </div>
  );
}
