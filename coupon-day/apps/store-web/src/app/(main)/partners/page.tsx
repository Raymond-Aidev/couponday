'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Users, Link2, MapPin, ChevronRight, Loader2, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import { partnershipApi, Partnership, storeApi } from '@/lib/api';

const tabs = [
  { id: 'active', label: '제휴중' },
  { id: 'pending', label: '요청' },
] as const;

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

const getCategoryIcon = (iconName?: string | null) => {
  if (!iconName) return '🍽️';
  return categoryIcons[iconName] || '🍽️';
};

export default function PartnersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('active');
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Fetch my store info
  const { data: myStore } = useQuery({
    queryKey: ['store', 'me'],
    queryFn: async () => {
      const response = await storeApi.getMe();
      return response.data;
    },
  });

  // Fetch all partnerships
  const { data: partnerships, isLoading } = useQuery({
    queryKey: ['partnerships'],
    queryFn: async () => {
      const response = await partnershipApi.getAll();
      return response.data;
    },
  });

  // Respond to partnership request
  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      partnershipApi.respond(id, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
    },
  });

  const handleRespond = async (id: string, accept: boolean) => {
    setRespondingId(id);
    try {
      await respondMutation.mutateAsync({ id, accept });
    } finally {
      setRespondingId(null);
    }
  };

  // Filter partnerships
  const activePartnerships = partnerships?.filter((p) => p.status === 'ACTIVE') ?? [];
  const pendingPartnerships = partnerships?.filter((p) => p.status === 'PENDING') ?? [];

  // Separate received and sent requests
  const receivedRequests = pendingPartnerships.filter(
    (p) => p.requestedBy !== myStore?.id
  );
  const sentRequests = pendingPartnerships.filter(
    (p) => p.requestedBy === myStore?.id
  );

  // Get partner store from partnership
  const getPartnerStore = (partnership: Partnership) => {
    if (partnership.distributorStoreId === myStore?.id) {
      return partnership.providerStore;
    }
    return partnership.distributorStore;
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <Header
        title="파트너"
        rightAction={
          <Link href="/partners/find">
            <Button variant="ghost" size="sm" className="p-2">
              <Search className="w-5 h-5" />
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
                'px-4 py-2 rounded-full text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              )}
            >
              {tab.label}
              {tab.id === 'pending' && pendingPartnerships.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingPartnerships.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : activeTab === 'active' ? (
          activePartnerships.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500 mb-2">아직 파트너가 없어요</p>
              <p className="text-sm text-secondary-400 mb-4">
                주변 점포와 크로스 쿠폰을 교환해보세요
              </p>
              <Link href="/partners/find">
                <Button variant="primary">파트너 찾기</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {activePartnerships.map((partnership) => {
                const partnerStore = getPartnerStore(partnership);
                return (
                  <Link key={partnership.id} href={`/partners/${partnership.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center text-2xl">
                          {getCategoryIcon(partnerStore?.category?.icon)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary-900">
                            {partnerStore?.name || '알 수 없음'}
                          </h3>
                          <p className="text-sm text-secondary-500">
                            {partnerStore?.category?.name || '카테고리 없음'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-secondary-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {partnerStore?.address?.split(' ').slice(0, 2).join(' ') || '주소 없음'}
                            </span>
                            <span>크로스쿠폰 {partnership.crossCoupons?.length || 0}개</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-secondary-400" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          // Pending requests tab
          pendingPartnerships.length === 0 ? (
            <Card className="text-center py-12">
              <Link2 className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">요청이 없어요</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Received requests */}
              {receivedRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-secondary-600 mb-2">
                    받은 요청 ({receivedRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {receivedRequests.map((partnership) => {
                      const partnerStore = getPartnerStore(partnership);
                      const isResponding = respondingId === partnership.id;
                      return (
                        <Card key={partnership.id}>
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                              {getCategoryIcon(partnerStore?.category?.icon)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                  받은 요청
                                </span>
                              </div>
                              <h3 className="font-semibold text-secondary-900">
                                {partnerStore?.name || '알 수 없음'}
                              </h3>
                              <p className="text-sm text-secondary-500">
                                {partnerStore?.category?.name} · {partnerStore?.address?.split(' ').slice(0, 2).join(' ')}
                              </p>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleRespond(partnership.id, true)}
                                  disabled={isResponding}
                                  isLoading={isResponding}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  수락
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleRespond(partnership.id, false)}
                                  disabled={isResponding}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  거절
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sent requests */}
              {sentRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-secondary-600 mb-2">
                    보낸 요청 ({sentRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {sentRequests.map((partnership) => {
                      const partnerStore = getPartnerStore(partnership);
                      return (
                        <Card key={partnership.id}>
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center text-2xl">
                              {getCategoryIcon(partnerStore?.category?.icon)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-secondary-100 text-secondary-600 text-xs font-medium rounded-full">
                                  보낸 요청
                                </span>
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                  대기 중
                                </span>
                              </div>
                              <h3 className="font-semibold text-secondary-900">
                                {partnerStore?.name || '알 수 없음'}
                              </h3>
                              <p className="text-sm text-secondary-500">
                                {partnerStore?.category?.name} · {partnerStore?.address?.split(' ').slice(0, 2).join(' ')}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* FAB */}
      <Link
        href="/partners/find"
        className="fixed right-4 bottom-24 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Search className="w-6 h-6" />
      </Link>
    </div>
  );
}
