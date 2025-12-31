'use client';

import { useState, useEffect } from 'react';
import { Search, List, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function MapPage() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header
        className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white via-white to-transparent px-4 py-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        {/* Search Bar */}
        <Link
          href="/search"
          className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg"
        >
          <Search className="w-5 h-5 text-secondary-400" />
          <span className="text-secondary-400">이 지역 검색</span>
        </Link>
      </header>

      {/* Map Placeholder */}
      <div className="h-screen bg-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-500 font-medium">지도 뷰</p>
          <p className="text-sm text-secondary-400 mt-1">
            Google Maps 또는 Kakao Maps 연동 필요
          </p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
        <div className="flex bg-white rounded-full shadow-lg p-1">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-primary-500 text-white'
                : 'text-secondary-600'
            }`}
          >
            지도
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-500 text-white'
                : 'text-secondary-600'
            }`}
          >
            <List className="w-4 h-4 inline mr-1" />
            목록
          </button>
        </div>
      </div>

      {/* Re-search Button */}
      <button className="absolute bottom-40 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white rounded-full shadow-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50">
        이 지역 다시 검색
      </button>
    </div>
  );
}
