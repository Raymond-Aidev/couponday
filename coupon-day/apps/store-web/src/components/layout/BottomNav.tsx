'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Home,
  Ticket,
  Users,
  Settings,
  UtensilsCrossed,
  LucideIcon,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: '홈', icon: Home },
  { href: '/coupons', label: '쿠폰', icon: Ticket },
  { href: '/menu', label: '메뉴', icon: UtensilsCrossed },
  { href: '/partners', label: '파트너', icon: Users },
  { href: '/settings', label: '설정', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  const handleNavClick = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Haptics not available
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-100 z-50">
      <div
        className="flex items-center justify-around h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
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
                'transition-colors duration-150',
                'active:scale-95',
                isActive ? 'text-primary-500' : 'text-secondary-400'
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={clsx(
                  'text-xs mt-1',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
