'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Ticket, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { couponApi, Coupon, CouponStatus } from '@/lib/api';
import { clsx } from 'clsx';

const tabs = [
  { id: 'ACTIVE', label: '운영중' },
  { id: 'SCHEDULED', label: '예약' },
  { id: 'ENDED', label: '종료' },
] as const;

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

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState<string>('ACTIVE');

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['coupons', activeTab],
    queryFn: async () => {
      const response = await couponApi.getAll(activeTab);
      return response.data;
    },
  });

  const coupons = couponsData || [];

  return (
    <div className="min-h-screen">
      <Header
        title="쿠폰 관리"
        rightAction={
          <Link href="/coupons/create">
            <Button variant="ghost" size="sm" className="p-2">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="px-4 py-3 bg-white border-b border-secondary-100">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupon List */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-secondary-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <Card className="text-center py-12">
            <Ticket className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500 mb-4">
              {activeTab === 'ACTIVE'
                ? '운영 중인 쿠폰이 없어요'
                : activeTab === 'SCHEDULED'
                ? '예약된 쿠폰이 없어요'
                : '종료된 쿠폰이 없어요'}
            </p>
            {activeTab !== 'ENDED' && (
              <Link href="/coupons/create">
                <Button variant="primary">쿠폰 만들기</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/coupons/create"
        className="fixed right-4 bottom-24 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const validUntil = new Date(coupon.validUntil);
  const isExpiringSoon =
    validUntil.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link href={`/coupons/${coupon.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  statusBadgeStyles[coupon.status]
                )}
              >
                {statusLabels[coupon.status]}
              </span>
              {isExpiringSoon && coupon.status === 'ACTIVE' && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600">
                  곧 종료
                </span>
              )}
            </div>

            <h3 className="font-semibold text-secondary-900 mb-1">
              {coupon.name}
            </h3>

            <p className="text-sm text-primary-500 font-medium">
              {coupon.discountType === 'FIXED'
                ? `${coupon.discountValue.toLocaleString()}원 할인`
                : `${coupon.discountValue}% 할인`}
            </p>

            <div className="flex items-center gap-4 mt-3 text-xs text-secondary-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {format(validUntil, 'M.d', { locale: ko })} 까지
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {coupon.statsRedeemed}/{coupon.statsIssued} 사용
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="text-right">
            <p className="text-2xl font-bold text-secondary-900">
              {coupon.statsRedemptionRate}%
            </p>
            <p className="text-xs text-secondary-500">사용률</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
