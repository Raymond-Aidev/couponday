'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, MapPin, TrendingUp, Users, Coins, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { partnershipApi, categoryApi, PartnerRecommendation } from '@/lib/api';
import { clsx } from 'clsx';

// Category icon mapping
const categoryIcons: Record<string, string> = {
  korean: '🍚',
  chinese: '🥟',
  japanese: '🍣',
  western: '🍝',
  cafe: '☕',
  snack: '🍜',
  other: '🍽️',
};

export default function PartnersFindPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [requestingStoreId, setRequestingStoreId] = useState<string | null>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryApi.getAll();
      return response.data;
    },
  });

  // Fetch AI recommended partners
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['partner-recommendations'],
    queryFn: async () => {
      const response = await partnershipApi.getRecommendations('provider', 20);
      return response.data;
    },
  });

  // Request partnership mutation
  const requestMutation = useMutation({
    mutationFn: (targetStoreId: string) => partnershipApi.request(targetStoreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
    },
  });

  const handleRequestPartnership = async (storeId: string) => {
    setRequestingStoreId(storeId);
    try {
      await requestMutation.mutateAsync(storeId);
    } finally {
      setRequestingStoreId(null);
    }
  };

  // Filter by category
  const filteredRecommendations = recommendations?.filter((rec) => {
    if (!selectedCategory) return true;
    return rec.store.category.id === selectedCategory;
  }) ?? [];

  // Get category name from icon
  const getCategoryIcon = (iconName?: string | null) => {
    if (!iconName) return '🍽️';
    return categoryIcons[iconName] || '🍽️';
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/partners" className="p-1">
            <ArrowLeft className="w-6 h-6 text-secondary-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-secondary-900">파트너 찾기</h1>
            <p className="text-xs text-secondary-500">AI가 추천하는 최적의 파트너</p>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="p-4 bg-white border-b border-secondary-200">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-600'
            )}
          >
            전체
          </button>
          {categoriesData?.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600'
              )}
            >
              <span>{getCategoryIcon(category.icon)}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">파트너 추천을 불러오는데 실패했습니다</p>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-500">추천 가능한 파트너가 없습니다</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-secondary-500">
              AI 추천 파트너 {filteredRecommendations.length}개
            </p>

            {filteredRecommendations.map((rec) => (
              <PartnerRecommendationCard
                key={rec.store.id}
                recommendation={rec}
                onRequest={() => handleRequestPartnership(rec.store.id)}
                isRequesting={requestingStoreId === rec.store.id}
                getCategoryIcon={getCategoryIcon}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function PartnerRecommendationCard({
  recommendation,
  onRequest,
  isRequesting,
  getCategoryIcon,
}: {
  recommendation: PartnerRecommendation;
  onRequest: () => void;
  isRequesting: boolean;
  getCategoryIcon: (icon?: string | null) => string;
}) {
  const { store, matchScore, reasons, expectedPerformance, categoryTransition } = recommendation;

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-primary-600 bg-primary-50';
    return 'text-secondary-600 bg-secondary-100';
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center text-2xl">
            {getCategoryIcon(store.category.icon)}
          </div>
          <div>
            <h3 className="font-semibold text-secondary-900">{store.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded">
                {store.category.name}
              </span>
              {store.distance && (
                <span className="text-xs text-secondary-500 flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {store.distance}m
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={clsx('px-3 py-1.5 rounded-lg font-bold text-lg', getScoreColor(matchScore))}>
          {matchScore}점
        </div>
      </div>

      {/* Transition Info */}
      <div className="px-4 py-2 bg-secondary-50 mx-4 rounded-lg">
        <p className="text-sm text-secondary-600">
          <span className="font-medium">{categoryTransition.from}</span>
          <span className="mx-2">→</span>
          <span className="font-medium">{categoryTransition.to}</span>
          <span className="text-primary-600 font-semibold ml-2">
            전환율 {Math.round(categoryTransition.transitionRate * 100)}%
          </span>
        </p>
      </div>

      {/* Reasons */}
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {reasons.slice(0, 3).map((reason, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
            >
              <CheckCircle className="w-3 h-3" />
              {reason}
            </span>
          ))}
        </div>
      </div>

      {/* Expected Performance */}
      <div className="grid grid-cols-3 divide-x divide-secondary-200 border-t border-secondary-200">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-secondary-500 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            예상 토큰 유입
          </div>
          <div className="font-bold text-secondary-900">
            {expectedPerformance.monthlyTokenInflow}건/월
          </div>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-secondary-500 text-xs mb-1">
            <Users className="w-3 h-3" />
            예상 쿠폰 선택
          </div>
          <div className="font-bold text-secondary-900">
            {expectedPerformance.monthlyCouponSelections}건/월
          </div>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-secondary-500 text-xs mb-1">
            <Coins className="w-3 h-3" />
            예상 ROI
          </div>
          <div className="font-bold text-primary-600">
            {(expectedPerformance.expectedRoi * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-2">
        <Button
          fullWidth
          onClick={onRequest}
          isLoading={isRequesting}
          disabled={isRequesting}
        >
          파트너 요청하기
        </Button>
      </div>
    </Card>
  );
}
