'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Home, MapPin, Wallet, User, LucideIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/map', label: '지도', icon: MapPin },
  { href: '/wallet', label: '쿠폰함', icon: Wallet },
  { href: '/profile', label: '마이', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const handleNavClick = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {}
    }
  };

  return (
    <nav className="bottom-nav z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={clsx(
                'flex flex-col items-center justify-center w-full h-full',
                'transition-colors duration-150 active:scale-95',
                isActive ? 'text-primary-500' : 'text-secondary-400'
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={clsx('text-xs mt-1', isActive ? 'font-semibold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
