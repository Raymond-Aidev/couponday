import { prisma } from '../../../database/prisma.js';
import type { Coupon } from '@prisma/client';

export interface AvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  reasonCode?: string;
  nextAvailable?: Date;
}

/**
 * 쿠폰 사용 가능 여부 판단 (7단계 체크)
 * PRD 7.1 기준
 */
export async function checkCouponAvailability(
  coupon: Coupon,
  customerId?: string,
  now: Date = new Date()
): Promise<AvailabilityResult> {
  // 1. 쿠폰 상태 확인
  if (coupon.status !== 'ACTIVE') {
    return {
      isAvailable: false,
      reason: '현재 사용할 수 없는 쿠폰입니다',
      reasonCode: 'COUPON_NOT_ACTIVE',
    };
  }

  // 2. 유효 기간 확인
  if (now < coupon.validFrom) {
    return {
      isAvailable: false,
      reason: '아직 사용 기간이 시작되지 않았습니다',
      reasonCode: 'NOT_STARTED_YET',
      nextAvailable: coupon.validFrom,
    };
  }
  if (now > coupon.validUntil) {
    return {
      isAvailable: false,
      reason: '만료된 쿠폰입니다',
      reasonCode: 'EXPIRED',
    };
  }

  // 3. 요일 확인
  const dayOfWeek = now.getDay(); // 0=일, 1=월, ...
  if (coupon.availableDays.length > 0 && !coupon.availableDays.includes(dayOfWeek)) {
    return {
      isAvailable: false,
      reason: '오늘은 사용할 수 없는 요일입니다',
      reasonCode: 'NOT_AVAILABLE_TODAY',
      nextAvailable: getNextAvailableDate(coupon.availableDays, now),
    };
  }

  // 4. 시간 확인
  if (coupon.availableTimeStart && coupon.availableTimeEnd) {
    const currentTime = formatTime(now);
    if (currentTime < coupon.availableTimeStart || currentTime > coupon.availableTimeEnd) {
      return {
        isAvailable: false,
        reason: `${coupon.availableTimeStart}~${coupon.availableTimeEnd}에만 사용 가능합니다`,
        reasonCode: 'NOT_AVAILABLE_NOW',
        nextAvailable: getNextAvailableTime(coupon.availableTimeStart, now),
      };
    }
  }

  // 5. 블랙아웃 날짜 확인
  const today = formatDate(now);
  if (coupon.blackoutDates.some((d) => formatDate(d) === today)) {
    return {
      isAvailable: false,
      reason: '오늘은 사용할 수 없는 날입니다',
      reasonCode: 'BLACKOUT_DATE',
      nextAvailable: getNextDayStart(now),
    };
  }

  // 6. 총 수량 확인
  if (coupon.totalQuantity !== null && coupon.statsRedeemed >= coupon.totalQuantity) {
    return {
      isAvailable: false,
      reason: '수량이 모두 소진되었습니다',
      reasonCode: 'SOLD_OUT',
    };
  }

  // 7. 일일 한도 확인
  if (coupon.dailyLimit !== null) {
    const todayRedeemed = await getTodayRedemptionCount(coupon.id);
    if (todayRedeemed >= coupon.dailyLimit) {
      return {
        isAvailable: false,
        reason: '오늘 사용 가능한 수량이 소진되었습니다',
        reasonCode: 'DAILY_LIMIT_REACHED',
        nextAvailable: getNextDayStart(now),
      };
    }
  }

  // 8. (옵션) 인당 사용 횟수 확인
  if (customerId && coupon.perUserLimit > 0) {
    const userRedemptions = await prisma.redemption.count({
      where: {
        couponId: coupon.id,
        customerId,
      },
    });
    if (userRedemptions >= coupon.perUserLimit) {
      return {
        isAvailable: false,
        reason: '이미 최대 사용 횟수에 도달했습니다',
        reasonCode: 'USER_LIMIT_REACHED',
      };
    }
  }

  return { isAvailable: true };
}

// Helper functions
function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5); // HH:mm
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getNextAvailableDate(availableDays: number[], now: Date): Date {
  const current = new Date(now);
  for (let i = 1; i <= 7; i++) {
    current.setDate(current.getDate() + 1);
    if (availableDays.includes(current.getDay())) {
      current.setHours(0, 0, 0, 0);
      return current;
    }
  }
  return current;
}

function getNextAvailableTime(timeStart: string, now: Date): Date {
  const [hours, minutes] = timeStart.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours!, minutes!, 0, 0);

  // If already past start time today, set to tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getNextDayStart(now: Date): Date {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

async function getTodayRedemptionCount(couponId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.redemption.count({
    where: {
      couponId,
      redeemedAt: { gte: today },
    },
  });
}
