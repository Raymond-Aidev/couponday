'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Minimum splash display time for branding
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  // Splash screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-orange-500">
      {/* Logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center animate-pulse">
          <span className="text-4xl font-bold text-primary-500">CD</span>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-white/20 rounded-full" />
        <div className="absolute -bottom-2 -left-6 w-12 h-12 bg-white/10 rounded-full" />
      </div>

      {/* Text */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          쿠폰데이
        </h1>
        <p className="text-lg text-white/80 mb-1">점포 관리</p>
        <p className="text-sm text-white/60">소상공인 쿠폰 생태계 플랫폼</p>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-12">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-white/40">
          Powered by CouponDay
        </p>
      </div>
    </div>
  );
}
