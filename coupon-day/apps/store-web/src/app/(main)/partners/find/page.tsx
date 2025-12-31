'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, MapPin, Star, Store } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { api } from '@/lib/api';

interface NearbyStore {
  id: string;
  name: string;
  category: { name: string };
  address: string;
  distance?: number;
  rating?: number;
}

export default function PartnersFindPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock data for now - in production, fetch from API
  const { data: nearbyStores = [] } = useQuery<NearbyStore[]>({
    queryKey: ['nearby-stores', selectedCategory],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          name: '카페 모카',
          category: { name: '카페/디저트' },
          address: '서울시 강남구 역삼동 200-10',
          distance: 150,
          rating: 4.5,
        },
        {
          id: '2',
          name: '청담 스시',
          category: { name: '일식' },
          address: '서울시 강남구 역삼동 180-5',
          distance: 320,
          rating: 4.8,
        },
        {
          id: '3',
          name: '용용선생',
          category: { name: '중식' },
          address: '서울시 강남구 역삼동 220-15',
          distance: 450,
          rating: 4.2,
        },
        {
          id: '4',
          name: '파스타 팩토리',
          category: { name: '양식' },
          address: '서울시 강남구 역삼동 190-8',
          distance: 280,
          rating: 4.6,
        },
      ];
    },
  });

  const categories = ['전체', '한식', '중식', '일식', '양식', '카페/디저트', '분식'];

  const filteredStores = nearbyStores.filter((store) => {
    if (searchQuery && !store.name.includes(searchQuery)) return false;
    if (selectedCategory && selectedCategory !== '전체' && store.category.name !== selectedCategory)
      return false;
    return true;
  });

  const handleRequestPartnership = (storeId: string) => {
    // In production, call API to request partnership
    alert('파트너십 요청이 전송되었습니다.');
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/partners" className="p-1">
            <ArrowLeft className="w-6 h-6 text-secondary-600" />
          </Link>
          <h1 className="text-lg font-semibold text-secondary-900">파트너 찾기</h1>
        </div>
      </header>

      {/* Search */}
      <div className="p-4 bg-white border-b border-secondary-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="점포명으로 검색"
            className="w-full pl-10 pr-4 py-3 bg-secondary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === '전체' ? null : category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                (category === '전체' && !selectedCategory) || selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-secondary-500">
          내 점포 주변 {filteredStores.length}개 점포
        </p>

        {filteredStores.map((store) => (
          <Card key={store.id} className="overflow-hidden">
            <div className="flex items-start gap-4 p-4">
              <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-8 h-8 text-secondary-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-secondary-900 truncate">{store.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded">
                    {store.category.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1 text-sm text-secondary-500">
                  <MapPin className="w-4 h-4" />
                  <span>{store.distance}m</span>
                  {store.rating && (
                    <>
                      <span className="mx-1">·</span>
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{store.rating}</span>
                    </>
                  )}
                </div>

                <p className="text-sm text-secondary-400 mt-1 truncate">{store.address}</p>
              </div>
            </div>

            <div className="px-4 pb-4">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => handleRequestPartnership(store.id)}
              >
                파트너십 요청
              </Button>
            </div>
          </Card>
        ))}

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-500">주변에 파트너 가능한 점포가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
