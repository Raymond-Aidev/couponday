'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session, redirect accordingly
    const initSession = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        router.replace('/home');
      } else {
        // Create anonymous session and redirect
        router.replace('/home');
      }
    };

    initSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-500">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">쿠폰데이</h1>
        <p className="text-primary-100">내 주변 맛집 쿠폰</p>
      </div>
    </div>
  );
}
