'use client';

import Link from 'next/link';
import {
  Ticket,
  Heart,
  Bell,
  HelpCircle,
  Settings,
  ChevronRight,
  Gift,
} from 'lucide-react';

const menuItems = [
  { icon: Ticket, label: '쿠폰 사용 내역', href: '/profile/history', badge: null },
  { icon: Heart, label: '즐겨찾기', href: '/profile/favorites', badge: null },
  { icon: Gift, label: '오늘의 선택', href: '/cross-coupon', badge: 'NEW' },
  { icon: Bell, label: '알림 설정', href: '/profile/notifications', badge: null },
  { icon: HelpCircle, label: '고객센터', href: '/profile/help', badge: null },
  { icon: Settings, label: '설정', href: '/profile/settings', badge: null },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="bg-primary-500 px-4 py-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">게스트</h1>
            <p className="text-primary-100 text-sm mt-0.5">로그인하고 더 많은 혜택을 받으세요</p>
          </div>
        </div>

        {/* Login Button */}
        <button className="w-full mt-4 py-3 bg-white rounded-xl font-semibold text-primary-500 hover:bg-primary-50 transition-colors">
          로그인 / 회원가입
        </button>
      </header>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-around">
          <Link href="/wallet" className="text-center">
            <p className="text-2xl font-bold text-secondary-900">0</p>
            <p className="text-xs text-secondary-500 mt-1">보유 쿠폰</p>
          </Link>
          <div className="w-px h-10 bg-secondary-200" />
          <Link href="/profile/history" className="text-center">
            <p className="text-2xl font-bold text-secondary-900">0원</p>
            <p className="text-xs text-secondary-500 mt-1">총 절약 금액</p>
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
