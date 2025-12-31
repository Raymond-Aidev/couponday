'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
  onBack?: () => void;
}

export function Header({
  title,
  showBack = false,
  rightAction,
  transparent = false,
  onBack,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Haptics not available
      }
    }

    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 flex items-center justify-between h-14 px-4',
        transparent ? 'bg-transparent' : 'bg-white border-b border-secondary-100'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Left */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary-100 active:bg-secondary-200 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-secondary-700" />
          </button>
        )}
      </div>

      {/* Center - Title */}
      {title && (
        <h1 className="flex-1 text-center font-semibold text-secondary-900 truncate">
          {title}
        </h1>
      )}

      {/* Right */}
      <div className="w-10 flex justify-end">{rightAction}</div>
    </header>
  );
}
