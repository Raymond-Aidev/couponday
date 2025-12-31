'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Ticket, QrCode, Clock, ChevronRight } from 'lucide-react';
import { couponApi, SavedCoupon } from '@/lib/api';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const tabs = [
  { id: 'SAVED', label: '사용 가능' },
  { id: 'USED', label: '사용 완료' },
] as const;

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<string>('SAVED');

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['my-coupons', activeTab],
    queryFn: async () => {
      const response = await couponApi.getMySavedCoupons();
      return response;
    },
  });

  const allCoupons = couponsData?.data || [];
  const filteredCoupons = allCoupons.filter((c) =>
    activeTab === 'SAVED' ? c.status === 'SAVED' : c.status === 'USED'
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="bg-white px-4 py-4 border-b border-secondary-100"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <h1 className="text-xl font-bold text-secondary-900">내 쿠폰함</h1>
      </header>

      {/* Stats */}
      <div className="bg-primary-500 px-4 py-6">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">
              {allCoupons.filter((c) => c.status === 'SAVED').length}
            </p>
            <p className="text-sm text-primary-100 mt-1">사용 가능</p>
          </div>
          <div className="w-px h-12 bg-primary-400" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">
              {allCoupons.filter((c) => c.status === 'USED').length}
            </p>
            <p className="text-sm text-primary-100 mt-1">사용 완료</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 bg-white border-b border-secondary-100">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600'
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
              <div key={i} className="h-28 bg-secondary-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500">
              {activeTab === 'SAVED' ? '저장한 쿠폰이 없어요' : '사용한 쿠폰이 없어요'}
            </p>
            {activeTab === 'SAVED' && (
              <Link
                href="/home"
                className="inline-block mt-4 px-6 py-2 bg-primary-500 text-white font-medium rounded-xl"
              >
                쿠폰 찾아보기
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCoupons.map((savedCoupon) => (
              <SavedCouponCard key={savedCoupon.id} savedCoupon={savedCoupon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SavedCouponCard({ savedCoupon }: { savedCoupon: SavedCoupon }) {
  const { coupon } = savedCoupon;
  const isUsed = savedCoupon.status === 'USED';
  const validUntil = new Date(coupon.validUntil);
  const isExpiringSoon = validUntil.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <Link href={`/wallet/${savedCoupon.id}`}>
      <div
        className={clsx(
          'coupon-card border p-4 transition-all',
          isUsed
            ? 'bg-secondary-50 border-secondary-200 opacity-60'
            : 'bg-white border-secondary-100 hover:shadow-md'
        )}
      >
        <div className="flex gap-3">
          {/* Store Logo */}
          <div
            className={clsx(
              'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
              isUsed ? 'bg-secondary-200' : 'bg-primary-100'
            )}
          >
            <span className="text-xl">{coupon.store.category?.icon || '🍽️'}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-secondary-500 truncate">{coupon.store.name}</p>
            <h3 className={clsx('font-semibold mt-0.5', isUsed ? 'text-secondary-500' : 'text-secondary-900')}>
              {coupon.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className={clsx('font-bold', isUsed ? 'text-secondary-400' : 'text-primary-500')}>
                {coupon.discountType === 'FIXED'
                  ? `${coupon.discountValue.toLocaleString()}원`
                  : `${coupon.discountValue}%`}
              </p>
              {!isUsed && isExpiringSoon && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  <Clock className="w-3 h-3" />
                  곧 만료
                </span>
              )}
            </div>
          </div>

          {/* QR / Status */}
          <div className="flex items-center">
            {isUsed ? (
              <span className="text-xs text-secondary-400">사용완료</span>
            ) : (
              <QrCode className="w-8 h-8 text-secondary-300" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-secondary-200 text-xs text-secondary-400">
          <span>
            {isUsed
              ? `${format(new Date(savedCoupon.usedAt!), 'M.d 사용', { locale: ko })}`
              : `~${format(validUntil, 'M.d', { locale: ko })} 까지`}
          </span>
          {!isUsed && (
            <span className="flex items-center gap-0.5 text-primary-500 font-medium">
              사용하기
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
