'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Ticket,
  Target,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { couponApi } from '@/lib/api';
import { clsx } from 'clsx';

export default function CouponPerformancePage() {
  const params = useParams();
  const router = useRouter();
  const couponId = params.id as string;

  // Fetch coupon basic info
  const { data: coupon } = useQuery({
    queryKey: ['coupon', couponId],
    queryFn: async () => {
      const response = await couponApi.getById(couponId);
      return response.data;
    },
  });

  // Fetch performance data
  const { data: performance, isLoading, error } = useQuery({
    queryKey: ['couponPerformance', couponId],
    queryFn: async () => {
      const response = await couponApi.getPerformance(couponId);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-secondary-300 mb-4" />
        <p className="text-secondary-500 mb-4">데이터를 불러올 수 없습니다</p>
        <Button onClick={() => router.back()}>돌아가기</Button>
      </div>
    );
  }

  // Default values if no performance data
  const roi = performance?.roi ?? 0;
  const totalRedemptions = performance?.totalRedemptions ?? 0;
  const totalSales = performance?.totalSales ?? 0;
  const averageOrderValue = performance?.averageOrderValue ?? 0;
  const dailyStats = performance?.dailyStats ?? [];

  const isPositiveRoi = roi > 0;

  // Calculate max values for chart
  const maxRedemptions = Math.max(...dailyStats.map((d: any) => d.redemptions), 1);
  const maxSales = Math.max(...dailyStats.map((d: any) => d.sales), 1);

  return (
    <div className="min-h-screen bg-secondary-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-secondary-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-secondary-600" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-secondary-900">성과 분석</h1>
            {coupon && (
              <p className="text-sm text-secondary-500">{coupon.name}</p>
            )}
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* ROI Card - Main KPI */}
        <Card className={clsx(
          'relative overflow-hidden',
          isPositiveRoi ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'
        )}>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">투자 대비 수익률 (ROI)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{roi.toFixed(1)}%</span>
              {isPositiveRoi ? (
                <TrendingUp className="w-8 h-8 opacity-75" />
              ) : (
                <TrendingDown className="w-8 h-8 opacity-75" />
              )}
            </div>
            <p className="mt-2 text-sm opacity-75">
              {isPositiveRoi
                ? '할인 비용 대비 추가 매출이 발생했어요'
                : '할인 비용이 추가 매출보다 많았어요'}
            </p>
          </div>
          {/* Background decoration */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute right-8 bottom-0 w-20 h-20 bg-white/10 rounded-full -mb-10" />
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-secondary-500">총 매출</p>
                <p className="text-lg font-bold text-secondary-900">
                  {totalSales.toLocaleString()}원
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-secondary-500">총 사용</p>
                <p className="text-lg font-bold text-secondary-900">
                  {totalRedemptions}회
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-secondary-500">평균 주문금액</p>
                <p className="text-lg font-bold text-secondary-900">
                  {averageOrderValue.toLocaleString()}원
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-secondary-500">분석 기간</p>
                <p className="text-lg font-bold text-secondary-900">
                  {dailyStats.length}일
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle>일별 사용 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <div className="space-y-3">
                {dailyStats.slice(-7).map((day: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-600">
                        {format(new Date(day.date), 'M/d (EEE)', { locale: ko })}
                      </span>
                      <span className="font-medium text-secondary-900">
                        {day.redemptions}회 / {day.sales.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {/* Redemptions bar */}
                      <div className="flex-1 h-3 bg-secondary-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{
                            width: `${(day.redemptions / maxRedemptions) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">아직 사용 데이터가 없어요</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights Card */}
        <Card>
          <CardHeader>
            <CardTitle>AI 인사이트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {totalRedemptions > 0 ? (
                <>
                  <InsightItem
                    type={isPositiveRoi ? 'positive' : 'negative'}
                    text={
                      isPositiveRoi
                        ? `이 쿠폰으로 인해 ${Math.abs(roi).toFixed(0)}% 추가 수익이 발생했어요.`
                        : `쿠폰 할인 비용이 추가 매출보다 ${Math.abs(roi).toFixed(0)}% 높았어요.`
                    }
                  />
                  <InsightItem
                    type="info"
                    text={`평균 주문 금액이 ${averageOrderValue.toLocaleString()}원이에요.`}
                  />
                  {coupon && coupon.statsIssued > coupon.statsRedeemed * 2 && (
                    <InsightItem
                      type="warning"
                      text="발급 대비 사용률이 낮아요. 유효기간이나 조건을 확인해보세요."
                    />
                  )}
                </>
              ) : (
                <InsightItem
                  type="info"
                  text="쿠폰이 사용되면 성과 분석이 시작됩니다."
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InsightItem({
  type,
  text,
}: {
  type: 'positive' | 'negative' | 'warning' | 'info';
  text: string;
}) {
  const styles = {
    positive: 'bg-green-50 border-green-200 text-green-700',
    negative: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const icons = {
    positive: <TrendingUp className="w-4 h-4" />,
    negative: <TrendingDown className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
    info: <Target className="w-4 h-4" />,
  };

  return (
    <div className={clsx('flex items-start gap-3 p-3 rounded-lg border', styles[type])}>
      <span className="mt-0.5">{icons[type]}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}
