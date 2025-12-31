/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Format business number for display
 */
export function formatBusinessNumber(businessNumber: string): string {
  const cleaned = businessNumber.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return businessNumber;
}

/**
 * Format currency (Korean Won)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get meal type from current time
 */
export function getMealTypeFromTime(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 10) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
}

/**
 * Check if current time is within available hours
 */
export function isWithinTimeRange(
  startTime: string | null,
  endTime: string | null,
  currentTime: Date = new Date()
): boolean {
  if (!startTime || !endTime) return true;

  const current = currentTime.toTimeString().slice(0, 5); // HH:mm
  return current >= startTime && current <= endTime;
}

/**
 * Check if current day is in available days
 */
export function isAvailableDay(
  availableDays: number[],
  currentDate: Date = new Date()
): boolean {
  if (!availableDays || availableDays.length === 0) return true;
  return availableDays.includes(currentDate.getDay());
}
