'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Ticket,
  Heart,
  Bell,
  HelpCircle,
  Settings,
  ChevronRight,
  Gift,
  User,
  LogIn,
} from 'lucide-react';
import { profileApi, couponApi, favoritesApi } from '@/lib/api';

const menuItems = [
  { icon: Ticket, label: '쿠폰 사용 내역', href: '/profile/history', badge: null },
  { icon: Heart, label: '즐겨찾기 가게', href: '/profile/favorites', badge: null },
  { icon: Gift, label: '오늘의 선택', href: '/tokens', badge: 'NEW' },
  { icon: Bell, label: '알림 설정', href: '/profile/notifications', badge: null },
  { icon: HelpCircle, label: '고객센터', href: '/profile/help', badge: null },
  { icon: Settings, label: '설정', href: '/profile/settings', badge: null },
];

export default function ProfilePage() {
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getMe(),
  });

  const { data: couponsData } = useQuery({
    queryKey: ['my-coupons'],
    queryFn: () => couponApi.getMySavedCoupons(),
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getAll(),
  });

  const profile = profileData?.data;
  const savedCoupons = couponsData?.data || [];
  const favorites = favoritesData?.data || [];
  const activeCoupons = savedCoupons.filter((c) => c.status === 'SAVED');

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header
        className="bg-gradient-to-br from-primary-500 to-primary-600 px-4 py-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            {profile?.nickname ? (
              <span className="text-2xl font-bold text-white">
                {profile.nickname.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-8 h-8 text-white/80" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">
              {profile?.nickname || '게스트'}
            </h1>
            <p className="text-primary-100 text-sm mt-0.5">
              {profile?.isAnonymous
                ? '로그인하고 더 많은 혜택을 받으세요'
                : `가입일: ${new Date(profile?.createdAt || '').toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {/* Login/Edit Button */}
        {profile?.isAnonymous ? (
          <button className="w-full mt-4 py-3 bg-white rounded-xl font-semibold text-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" />
            로그인 / 회원가입
          </button>
        ) : (
          <Link
            href="/profile/edit"
            className="block w-full mt-4 py-3 bg-white/20 rounded-xl font-medium text-white text-center hover:bg-white/30 transition-colors"
          >
            프로필 수정
          </Link>
        )}
      </header>

      {/* Stats Cards */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-3 gap-4">
            <Link href="/wallet" className="text-center">
              <p className="text-2xl font-bold text-primary-500">{activeCoupons.length}</p>
              <p className="text-xs text-secondary-500 mt-1">보유 쿠폰</p>
            </Link>
            <Link href="/profile/favorites" className="text-center border-x border-secondary-100">
              <p className="text-2xl font-bold text-secondary-900">{favorites.length}</p>
              <p className="text-xs text-secondary-500 mt-1">즐겨찾기</p>
            </Link>
            <Link href="/profile/history" className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {profile?.statsTotalSavedAmount?.toLocaleString() || 0}
                <span className="text-sm font-normal">원</span>
              </p>
              <p className="text-xs text-secondary-500 mt-1">총 절약</p>
            </Link>
          </div>

          {/* Coupon Stats */}
          <div className="mt-4 pt-4 border-t border-secondary-100 flex items-center justify-around text-sm">
            <div className="text-center">
              <p className="text-secondary-900 font-medium">{profile?.statsCouponsSaved || 0}</p>
              <p className="text-secondary-400 text-xs">저장한 쿠폰</p>
            </div>
            <div className="w-px h-8 bg-secondary-100" />
            <div className="text-center">
              <p className="text-secondary-900 font-medium">{profile?.statsCouponsUsed || 0}</p>
              <p className="text-secondary-400 text-xs">사용한 쿠폰</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/tokens"
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white"
          >
            <Gift className="w-8 h-8 mb-2" />
            <p className="font-semibold">오늘의 선택</p>
            <p className="text-xs opacity-90 mt-0.5">크로스 쿠폰 받기</p>
          </Link>
          <Link
            href="/tokens/scan"
            className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white"
          >
            <Ticket className="w-8 h-8 mb-2" />
            <p className="font-semibold">QR 스캔</p>
            <p className="text-xs opacity-90 mt-0.5">토큰 받기</p>
          </Link>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 hover:bg-secondary-50 active:bg-secondary-100 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-secondary-100' : ''
                }`}
              >
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-secondary-600" />
                </div>
                <span className="flex-1 font-medium text-secondary-800">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-secondary-400" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* App Version */}
      <div className="p-4 mt-4 text-center">
        <p className="text-sm text-secondary-400">쿠폰데이 v1.0.0</p>
      </div>
    </div>
  );
}
