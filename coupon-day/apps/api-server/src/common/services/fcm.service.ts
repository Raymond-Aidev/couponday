import * as admin from 'firebase-admin';
import { env } from '../../config/env.js';

/**
 * 알림 타입
 */
export enum NotificationType {
  // 고객용
  COUPON_SAVED = 'COUPON_SAVED',
  COUPON_EXPIRING = 'COUPON_EXPIRING',
  TOKEN_RECEIVED = 'TOKEN_RECEIVED',
  TOKEN_EXPIRING = 'TOKEN_EXPIRING',
  STORE_NEW_COUPON = 'STORE_NEW_COUPON',

  // 점주용
  PARTNERSHIP_REQUEST = 'PARTNERSHIP_REQUEST',
  PARTNERSHIP_ACCEPTED = 'PARTNERSHIP_ACCEPTED',
  PARTNERSHIP_REJECTED = 'PARTNERSHIP_REJECTED',
  COUPON_REDEEMED = 'COUPON_REDEEMED',
  DAILY_SUMMARY = 'DAILY_SUMMARY',
}

/**
 * 알림 페이로드
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * 알림 발송 결과
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Firebase Cloud Messaging 서비스
 */
class FCMService {
  private app: admin.app.App | null = null;
  private initialized = false;
  private available = false;

  /**
   * FCM 초기화
   */
  initialize(): boolean {
    if (this.initialized) return this.available;

    this.initialized = true;

    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
      console.warn('FCM Service: Firebase credentials not configured, push notifications disabled');
      return false;
    }

    try {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      this.available = true;
      console.warn('FCM Service: Initialized successfully');
      return true;
    } catch (error) {
      console.error('FCM Service: Failed to initialize', error);
      return false;
    }
  }

  /**
   * 서비스 사용 가능 여부
   */
  isAvailable(): boolean {
    return this.initialize();
  }

  /**
   * 단일 디바이스에 알림 전송
   */
  async sendToDevice(token: string, payload: NotificationPayload): Promise<SendResult> {
    if (!this.initialize() || !this.app) {
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: {
          type: payload.type,
          ...payload.data,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'couponday_default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging(this.app).send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('FCM send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 여러 디바이스에 알림 전송
   */
  async sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<{ successCount: number; failureCount: number; results: SendResult[] }> {
    if (!this.initialize() || !this.app) {
      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({ success: false, error: 'FCM not configured' })),
      };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: {
          type: payload.type,
          ...payload.data,
        },
      };

      const response = await admin.messaging(this.app).sendEachForMulticast(message);

      const results: SendResult[] = response.responses.map((resp, index) => {
        if (resp.success) {
          return { success: true, messageId: resp.messageId };
        }
        return { success: false, error: resp.error?.message };
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        results,
      };
    } catch (error: any) {
      console.error('FCM multicast error:', error);
      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({ success: false, error: error.message })),
      };
    }
  }

  /**
   * 토픽에 알림 전송
   */
  async sendToTopic(topic: string, payload: NotificationPayload): Promise<SendResult> {
    if (!this.initialize() || !this.app) {
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type: payload.type,
          ...payload.data,
        },
      };

      const response = await admin.messaging(this.app).send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('FCM topic send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 토큰 유효성 검사 (토큰 정리용)
   */
  async validateTokens(tokens: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    if (!this.initialize() || !this.app) {
      return { valid: [], invalid: tokens };
    }

    const valid: string[] = [];
    const invalid: string[] = [];

    // Dry run으로 토큰 유효성 검사
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: { title: 'test' },
      };

      const response = await admin.messaging(this.app).sendEachForMulticast(message, true); // dryRun

      response.responses.forEach((resp, index) => {
        if (resp.success) {
          valid.push(tokens[index]);
        } else {
          invalid.push(tokens[index]);
        }
      });
    } catch {
      // 에러 시 모든 토큰을 invalid로 처리하지 않음
    }

    return { valid, invalid };
  }
}

export const fcmService = new FCMService();
