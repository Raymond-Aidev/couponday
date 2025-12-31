'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  TrendingUp,
  Ticket,
  Users,
  Bell,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { storeApi, couponApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';

export default function DashboardPage() {
  const store = useAuthStore((state) => state.store);

  const { data: storeData } = useQuery({
    queryKey: ['store', 'me'],
    queryFn: async () => {
      const response = await storeApi.getMe();
      return response.data;
    },
  });

  const { data: couponsData } = useQuery({
    queryKey: ['coupons', 'active'],
    queryFn: async () => {
      const response = await couponApi.getAll('ACTIVE');
      return response.data;
    },
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ['coupons', 'recommendations'],
    queryFn: async () => {
      const response = await couponApi.getRecommendations();
      return response.data;
    },
  });

  const today = format(new Date(), 'M월 d일 EEEE', { locale: ko });
  const activeCoupons = couponsData || [];
  const recommendations = recommendationsData || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary-500 text-white px-4 pt-6 pb-12">
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-100 text-sm">{today}</p>
              <h1 className="text-xl font-bold mt-1">
                안녕하세요, {storeData?.name || store?.name}님
              </h1>
            </div>
            <button className="relative p-2 rounded-full bg-white/10 hover:bg-white/20">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 -mt-8">
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-900">0</p>
              <p className="text-xs text-secondary-500">오늘 매출</p>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Ticket className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-900">
                {activeCoupons.length}
              </p>
              <p className="text-xs text-secondary-500">활성 쿠폰</p>
            </div>
          </Card>

          <Card className="text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-900">0</p>
              <p className="text-xs text-secondary-500">오늘 사용</p>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="px-4 mt-6">
          <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <CardTitle className="text-primary-700">AI 추천</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recommendations.slice(0, 2).map((rec, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b last:border-0 border-primary-100"
                >
                  <div>
                    <p className="font-medium text-secondary-900">{rec.title}</p>
                    <p className="text-sm text-secondary-500 mt-0.5">
                      {rec.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-secondary-400 flex-shrink-0" />
                </div>
              ))}
              <Button variant="outline" fullWidth className="mt-4" size="sm">
                모든 추천 보기
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Coupons */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-secondary-900">운영 중인 쿠폰</h2>
          <Link
            href="/coupons"
            className="text-sm text-primary-500 hover:underline"
          >
            전체보기
          </Link>
        </div>

        {activeCoupons.length === 0 ? (
          <Card className="text-center py-8">
            <Ticket className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-500 mb-4">
              아직 운영 중인 쿠폰이 없어요
            </p>
            <Link href="/coupons/create">
              <Button variant="primary" size="sm">
                첫 쿠폰 만들기
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeCoupons.slice(0, 3).map((coupon) => (
              <Link key={coupon.id} href={`/coupons/${coupon.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">
                        {coupon.name}
                      </p>
                      <p className="text-sm text-secondary-500 mt-0.5">
                        {coupon.discountType === 'FIXED'
                          ? `${coupon.discountValue.toLocaleString()}원 할인`
                          : `${coupon.discountValue}% 할인`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary-500">
                        {coupon.statsRedeemed}회 사용
                      </p>
                      <p className="text-xs text-secondary-400 mt-0.5">
                        {coupon.statsIssued}회 발급
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6 mb-8">
        <h2 className="font-semibold text-secondary-900 mb-3">빠른 실행</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/coupons/create">
            <Card className="text-center py-4 hover:shadow-md transition-shadow haptic-tap">
              <Ticket className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-secondary-700">쿠폰 만들기</p>
            </Card>
          </Link>
          <Link href="/partners/find">
            <Card className="text-center py-4 hover:shadow-md transition-shadow haptic-tap">
              <Users className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-secondary-700">파트너 찾기</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
