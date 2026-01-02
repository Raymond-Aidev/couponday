'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, MapPin, ChevronRight, Ticket } from 'lucide-react';
import { couponApi, Coupon } from '@/lib/api';
import { clsx } from 'clsx';

const categories = [
  { id: 'all', label: '전체', icon: '🍽️' },
  { id: 'korean', label: '한식', icon: '🍚' },
  { id: 'chinese', label: '중식', icon: '🥟' },
  { id: 'japanese', label: '일식', icon: '🍣' },
  { id: 'western', label: '양식', icon: '🍝' },
  { id: 'cafe', label: '카페', icon: '☕' },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Seoul if location denied
          setLocation({ lat: 37.5665, lng: 126.9780 });
        }
      );
    }
  }, []);

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['coupons', 'nearby', location],
    queryFn: async () => {
      if (!location) return { data: [] };
      const response = await couponApi.getNearby(location.lat, location.lng, 2000);
      return response;
    },
    enabled: !!location,
  });

  const coupons = couponsData?.data || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white px-4 pt-4 pb-3 sticky top-0 z-30" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <div className="flex items-center gap-2 mb-4">
          <button className="flex items-center gap-1 text-secondary-700">
            <MapPin className="w-5 h-5 text-primary-500" />
            <span className="font-medium">역삼동</span>
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
        </div>

        {/* Search */}
        <Link
          href="/search"
          className="flex items-center gap-3 bg-secondary-100 rounded-xl px-4 py-3"
        >
          <Search className="w-5 h-5 text-secondary-400" />
          <span className="text-secondary-400">맛집, 쿠폰 검색</span>
        </Link>
      </header>

      {/* Categories */}
      <div className="px-4 py-3 bg-white border-b border-secondary-100 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-colors',
                selectedCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600'
              )}
            >
              <span>{cat.icon}</span>
              <span className="font-medium text-sm">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Coupon List */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-secondary-900">내 주변 쿠폰</h2>
          <Link href="/map" className="text-sm text-primary-500 flex items-center gap-1">
            지도로 보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-secondary-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500">주변에 쿠폰이 없어요</p>
            <p className="text-sm text-secondary-400 mt-1">다른 지역을 검색해보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  return (
    <Link href={`/coupons/${coupon.id}`}>
      <div className="coupon-card shadow-sm border border-secondary-100 p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          {/* Store Logo */}
          <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{coupon.store.category?.icon || '🍽️'}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-secondary-500 truncate">{coupon.store.name}</p>
            <h3 className="font-semibold text-secondary-900 mt-0.5">{coupon.name}</h3>
            <p className="text-lg font-bold text-primary-500 mt-1">
              {coupon.discountType === 'FIXED'
                ? `${coupon.discountValue.toLocaleString()}원 할인`
                : `${coupon.discountValue}% 할인`}
            </p>
          </div>

          {/* Get Button */}
          <button className="self-center px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 active:scale-95 transition-all">
            받기
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-secondary-200 text-xs text-secondary-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            150m
          </span>
          <span>~{new Date(coupon.validUntil).toLocaleDateString()} 까지</span>
        </div>
      </div>
    </Link>
  );
}
