'use client';

import { useRouter } from 'next/navigation';
import {
  Store,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth.store';

const menuItems = [
  {
    id: 'store',
    icon: Store,
    label: '점포 정보',
    description: '상호명, 주소, 영업시간 등',
    href: '/settings/store',
  },
  {
    id: 'account',
    icon: User,
    label: '계정 관리',
    description: '비밀번호 변경, 직원 계정',
    href: '/settings/account',
  },
  {
    id: 'payment',
    icon: CreditCard,
    label: '정산 관리',
    description: '계좌 정보, 정산 내역',
    href: '/settings/payment',
  },
  {
    id: 'notification',
    icon: Bell,
    label: '알림 설정',
    description: '푸시 알림, 이메일 알림',
    href: '/settings/notification',
  },
  {
    id: 'security',
    icon: Shield,
    label: '보안',
    description: '로그인 기록, 2단계 인증',
    href: '/settings/security',
  },
  {
    id: 'help',
    icon: HelpCircle,
    label: '고객센터',
    description: '자주 묻는 질문, 문의하기',
    href: '/settings/help',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { store, account, logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      router.replace('/login');
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="설정" />

      {/* Profile Card */}
      <div className="p-4">
        <Card className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Store className="w-8 h-8 text-primary-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-secondary-900">
              {store?.name}
            </h2>
            <p className="text-sm text-secondary-500">{account?.ownerName}</p>
            <p className="text-sm text-secondary-400">{account?.phone}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary-400" />
        </Card>
      </div>

      {/* Menu List */}
      <div className="px-4 mt-2">
        <Card padding="none">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary-50 active:bg-secondary-100 transition-colors ${
                  index !== menuItems.length - 1
                    ? 'border-b border-secondary-100'
                    : ''
                }`}
              >
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-secondary-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-secondary-900">{item.label}</p>
                  <p className="text-sm text-secondary-500">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-secondary-400" />
              </button>
            );
          })}
        </Card>
      </div>

      {/* Logout */}
      <div className="p-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>

      {/* App Version */}
      <div className="p-4 text-center">
        <p className="text-sm text-secondary-400">쿠폰데이 점포 v1.0.0</p>
      </div>
    </div>
  );
}
