'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Users, Link2, MapPin, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';

const tabs = [
  { id: 'active', label: '제휴중' },
  { id: 'requests', label: '요청' },
] as const;

// 임시 데이터
const mockPartners = [
  {
    id: '1',
    name: '카페 모카',
    category: '카페/디저트',
    distance: 150,
    crossCoupons: 2,
    status: 'active',
  },
];

const mockRequests = [
  {
    id: '2',
    name: '수제버거집',
    category: '양식',
    distance: 200,
    type: 'received',
    message: '식사 후 디저트 할인 제휴를 제안드립니다.',
  },
];

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState<string>('active');

  return (
    <div className="min-h-screen">
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
              {tab.id === 'requests' && mockRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {mockRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'active' ? (
          mockPartners.length === 0 ? (
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
              {mockPartners.map((partner) => (
                <Link key={partner.id} href={`/partners/${partner.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center">
                        <Link2 className="w-7 h-7 text-secondary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-secondary-500">
                          {partner.category}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-secondary-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {partner.distance}m
                          </span>
                          <span>크로스쿠폰 {partner.crossCoupons}개</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-secondary-400" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : (
          // Requests tab
          mockRequests.length === 0 ? (
            <Card className="text-center py-12">
              <Link2 className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">받은 요청이 없어요</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {mockRequests.map((request) => (
                <Card key={request.id}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Link2 className="w-7 h-7 text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                          {request.type === 'received' ? '받은 요청' : '보낸 요청'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-secondary-900">
                        {request.name}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-1">
                        {request.message}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="primary" size="sm" className="flex-1">
                          수락
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          거절
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
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
