'use client';

import { BottomNav } from '@/components/layout/BottomNav';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary-50 pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
