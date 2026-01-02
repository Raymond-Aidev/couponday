import { prisma } from '../../database/prisma.js';
import { fcmService, NotificationType, NotificationPayload } from '../../common/services/fcm.service.js';

/**
 * 알림 서비스
 * 고객/점주 푸시 알림 발송 관리
 */
export class NotificationService {
  // ==========================================
  // 디바이스 토큰 관리
  // ==========================================

  /**
   * 고객 디바이스 등록
   */
  async registerCustomerDevice(
    customerId: string,
    fcmToken: string,
    platform: string,
    deviceModel?: string
  ) {
    // Upsert: 토큰이 이미 있으면 업데이트
    return prisma.customerDevice.upsert({
      where: { fcmToken },
      create: {
        customerId,
        fcmToken,
        platform,
        deviceModel,
        isActive: true,
      },
      update: {
        customerId,
        platform,
        deviceModel,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * 고객 디바이스 해제
   */
  async unregisterCustomerDevice(customerId: string, fcmToken: string) {
    return prisma.customerDevice.updateMany({
      where: { customerId, fcmToken },
      data: { isActive: false },
    });
  }

  /**
   * 점포 디바이스 등록
   */
  async registerStoreDevice(
    accountId: string,
    fcmToken: string,
    platform: string,
    deviceModel?: string
  ) {
    return prisma.storeDevice.upsert({
      where: { fcmToken },
      create: {
        accountId,
        fcmToken,
        platform,
        deviceModel,
        isActive: true,
      },
      update: {
        accountId,
        platform,
        deviceModel,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * 점포 디바이스 해제
   */
  async unregisterStoreDevice(accountId: string, fcmToken: string) {
    return prisma.storeDevice.updateMany({
      where: { accountId, fcmToken },
      data: { isActive: false },
    });
  }

  // ==========================================
  // 고객 알림
  // ==========================================

  /**
   * 고객에게 알림 전송
   */
  async notifyCustomer(customerId: string, payload: NotificationPayload) {
    if (!fcmService.isAvailable()) return;

    const devices = await prisma.customerDevice.findMany({
      where: { customerId, isActive: true },
      select: { fcmToken: true },
    });

    if (devices.length === 0) return;

    const tokens = devices.map((d) => d.fcmToken);

    if (tokens.length === 1) {
      await fcmService.sendToDevice(tokens[0], payload);
    } else {
      await fcmService.sendToMultipleDevices(tokens, payload);
    }
  }

  /**
   * 쿠폰 저장 알림
   */
  async notifyCouponSaved(customerId: string, couponName: string, storeName: string) {
    await this.notifyCustomer(customerId, {
      type: NotificationType.COUPON_SAVED,
      title: '쿠폰이 저장되었습니다',
      body: `${storeName}의 "${couponName}" 쿠폰이 쿠폰함에 저장되었습니다.`,
    });
  }

  /**
   * 쿠폰 만료 임박 알림
   */
  async notifyCouponExpiring(customerId: string, couponName: string, expiresIn: string) {
    await this.notifyCustomer(customerId, {
      type: NotificationType.COUPON_EXPIRING,
      title: '쿠폰 만료 임박',
      body: `"${couponName}" 쿠폰이 ${expiresIn} 후 만료됩니다. 지금 사용해보세요!`,
    });
  }

  /**
   * 토큰 수령 알림
   */
  async notifyTokenReceived(customerId: string, storeName: string) {
    await this.notifyCustomer(customerId, {
      type: NotificationType.TOKEN_RECEIVED,
      title: '파트너 쿠폰을 받았습니다',
      body: `${storeName}에서 파트너 쿠폰 토큰을 발급했습니다. 지금 선택하세요!`,
    });
  }

  /**
   * 즐겨찾기 점포 새 쿠폰 알림
   */
  async notifyNewCouponFromFavoriteStore(customerId: string, storeName: string, couponName: string) {
    await this.notifyCustomer(customerId, {
      type: NotificationType.STORE_NEW_COUPON,
      title: `${storeName}의 새 쿠폰!`,
      body: `"${couponName}" 쿠폰이 등록되었습니다. 지금 저장하세요!`,
    });
  }

  // ==========================================
  // 점주 알림
  // ==========================================

  /**
   * 점포에게 알림 전송
   */
  async notifyStore(storeId: string, payload: NotificationPayload) {
    if (!fcmService.isAvailable()) return;

    const accounts = await prisma.storeAccount.findMany({
      where: { storeId, isActive: true },
      select: {
        devices: {
          where: { isActive: true },
          select: { fcmToken: true },
        },
      },
    });

    const tokens = accounts.flatMap((a) => a.devices.map((d) => d.fcmToken));

    if (tokens.length === 0) return;

    if (tokens.length === 1) {
      await fcmService.sendToDevice(tokens[0], payload);
    } else {
      await fcmService.sendToMultipleDevices(tokens, payload);
    }
  }

  /**
   * 파트너십 요청 알림
   */
  async notifyPartnershipRequest(targetStoreId: string, fromStoreName: string) {
    await this.notifyStore(targetStoreId, {
      type: NotificationType.PARTNERSHIP_REQUEST,
      title: '새 파트너십 요청',
      body: `${fromStoreName}에서 파트너십을 요청했습니다. 확인해주세요.`,
    });
  }

  /**
   * 파트너십 수락 알림
   */
  async notifyPartnershipAccepted(storeId: string, partnerStoreName: string) {
    await this.notifyStore(storeId, {
      type: NotificationType.PARTNERSHIP_ACCEPTED,
      title: '파트너십이 수락되었습니다',
      body: `${partnerStoreName}과의 파트너십이 성사되었습니다! 이제 크로스쿠폰을 설정하세요.`,
    });
  }

  /**
   * 쿠폰 사용 알림
   */
  async notifyCouponRedeemed(storeId: string, couponName: string, discountAmount: number) {
    await this.notifyStore(storeId, {
      type: NotificationType.COUPON_REDEEMED,
      title: '쿠폰이 사용되었습니다',
      body: `"${couponName}" 쿠폰이 사용되었습니다. (${discountAmount.toLocaleString()}원 할인)`,
    });
  }

  // ==========================================
  // 대량 알림 (스케줄러용)
  // ==========================================

  /**
   * 만료 임박 쿠폰 보유 고객들에게 알림
   */
  async notifyExpiringCoupons() {
    if (!fcmService.isAvailable()) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘/내일 만료되는 쿠폰을 가진 고객들
    const expiringCoupons = await prisma.savedCoupon.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gte: today, lte: tomorrow },
        customer: {
          devices: {
            some: { isActive: true },
          },
        },
      },
      include: {
        customer: {
          include: {
            devices: { where: { isActive: true } },
          },
        },
        coupon: { select: { name: true } },
      },
    });

    for (const sc of expiringCoupons) {
      const expiresIn = sc.expiresAt.toDateString() === today.toDateString() ? '오늘' : '내일';
      await this.notifyCouponExpiring(sc.customerId, sc.coupon.name, expiresIn);
    }

    return { notified: expiringCoupons.length };
  }
}

export const notificationService = new NotificationService();
