'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Heart,
  Share2,
  Ticket,
  ChevronRight,
  Star,
} from 'lucide-react';
import { storeApi, couponApi, favoritesApi, Store, Coupon } from '@/lib/api';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const storeId = params.id as string;

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => storeApi.getById(storeId),
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getAll(),
  });

  const store = storeData?.data;
  const isFavorite = favoritesData?.data?.some((f) => f.store.id === storeId) ?? false;

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await favoritesApi.remove(storeId);
      } else {
        await favoritesApi.add(storeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const saveCoupon = useMutation({
    mutationFn: (couponId: string) => couponApi.save(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', storeId] });
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="h-48 bg-secondary-200 animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-secondary-200 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-secondary-200 rounded animate-pulse w-3/4" />
          <div className="h-32 bg-secondary-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary-500">가게를 찾을 수 없습니다</p>
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

  return (
    <div className="min-h-screen bg-secondary-50 pb-24">
      {/* Header Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm"
          style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          <ArrowLeft className="w-5 h-5 text-secondary-700" />
        </button>

        {/* Actions */}
        <div
          className="absolute top-4 right-4 flex gap-2"
          style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          <button
            onClick={() => toggleFavorite.mutate()}
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center shadow-sm backdrop-blur',
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-secondary-700'
            )}
          >
            <Heart className={clsx('w-5 h-5', isFavorite && 'fill-current')} />
          </button>
          <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
            <Share2 className="w-5 h-5 text-secondary-700" />
          </button>
        </div>

        {/* Store Icon */}
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
            <span className="text-4xl">{store.category?.icon || '🍽️'}</span>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="pt-14 px-4 pb-4 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full mb-2">
              {store.category?.name || '음식점'}
            </span>
            <h1 className="text-xl font-bold text-secondary-900">{store.name}</h1>
          </div>
        </div>

        {store.description && (
          <p className="text-secondary-600 mt-2 text-sm">{store.description}</p>
        )}

        {/* Info Items */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-secondary-600 text-sm">
            <MapPin className="w-4 h-4 text-secondary-400 flex-shrink-0" />
            <span>{store.address}</span>
          </div>
          {/* TODO: Add operating hours when available */}
          <div className="flex items-center gap-2 text-secondary-600 text-sm">
            <Clock className="w-4 h-4 text-secondary-400 flex-shrink-0" />
            <span>영업시간 정보 없음</span>
          </div>
        </div>

        {/* Map Preview */}
        <button
          onClick={() => {
            // Open in external map app
            const url = `https://map.kakao.com/link/map/${store.name},${store.latitude},${store.longitude}`;
            window.open(url, '_blank');
          }}
          className="mt-4 w-full h-24 bg-secondary-100 rounded-xl flex items-center justify-center gap-2 text-secondary-500"
        >
          <MapPin className="w-5 h-5" />
          <span>지도에서 보기</span>
        </button>
      </div>

      {/* Coupons Section */}
      <div className="mt-2 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary-500" />
            이 가게 쿠폰
          </h2>
          <span className="text-sm text-secondary-400">{store.coupons?.length || 0}개</span>
        </div>

        {!store.coupons || store.coupons.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="w-12 h-12 text-secondary-300 mx-auto mb-2" />
            <p className="text-secondary-500">등록된 쿠폰이 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {store.coupons.map((coupon) => (
              <StoreCouponCard
                key={coupon.id}
                coupon={coupon}
                onSave={() => saveCoupon.mutate(coupon.id)}
                isSaving={saveCoupon.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoreCouponCard({
  coupon,
  onSave,
  isSaving,
}: {
  coupon: Coupon;
  onSave: () => void;
  isSaving: boolean;
}) {
  const validUntil = new Date(coupon.validUntil);
  const isExpiringSoon = validUntil.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="coupon-card border border-secondary-100 p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-secondary-900">{coupon.name}</h3>
          <p className="text-lg font-bold text-primary-500 mt-1">
            {coupon.discountType === 'FIXED'
              ? `${coupon.discountValue.toLocaleString()}원 할인`
              : `${coupon.discountValue}% 할인`}
          </p>
          {coupon.description && (
            <p className="text-sm text-secondary-500 mt-1">{coupon.description}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onSave();
          }}
          disabled={isSaving}
          className="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '받기'}
        </button>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-secondary-200 text-xs text-secondary-400">
        <span className={clsx(isExpiringSoon && 'text-red-500 font-medium')}>
          ~{format(validUntil, 'M.d', { locale: ko })} 까지
        </span>
        {coupon.availableDays && coupon.availableDays.length < 7 && (
          <span>
            {coupon.availableDays.map((d) => ['일', '월', '화', '수', '목', '금', '토'][d]).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
