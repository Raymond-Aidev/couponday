import QRCode from 'qrcode';
import crypto from 'crypto';
import { env } from '../../config/env.js';

/**
 * QR 페이로드 타입
 */
export interface CustomerCouponQRPayload {
  type: 'CUSTOMER_COUPON';
  savedCouponId: string;
  customerId: string;
  couponId: string;
  storeId: string;
  expiresAt: number; // Unix timestamp (seconds)
  issuedAt: number;
}

export interface QRGenerateResult {
  qrCode: string; // Base64 PNG image
  qrData: string; // Signed payload
  expiresAt: Date;
}

export interface QRVerifyResult {
  valid: boolean;
  payload?: CustomerCouponQRPayload;
  error?: string;
}

/**
 * QR Code Service
 * - QR 코드 생성 및 검증
 * - HMAC-SHA256 서명으로 위변조 방지
 */
class QRService {
  private readonly secretKey: string;
  private readonly algorithm = 'sha256';

  constructor() {
    // Use JWT_SECRET as HMAC key
    this.secretKey = env.JWT_SECRET;
  }

  /**
   * QR 페이로드 서명 생성
   */
  private sign(payload: CustomerCouponQRPayload): string {
    const data = JSON.stringify(payload);
    const hmac = crypto.createHmac(this.algorithm, this.secretKey);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * 서명 검증
   */
  private verify(payload: CustomerCouponQRPayload, signature: string): boolean {
    const expectedSignature = this.sign(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * 고객 쿠폰 QR 코드 생성
   */
  async generateCustomerCouponQR(params: {
    savedCouponId: string;
    customerId: string;
    couponId: string;
    storeId: string;
    expiresAt: Date;
  }): Promise<QRGenerateResult> {
    const now = new Date();

    const payload: CustomerCouponQRPayload = {
      type: 'CUSTOMER_COUPON',
      savedCouponId: params.savedCouponId,
      customerId: params.customerId,
      couponId: params.couponId,
      storeId: params.storeId,
      expiresAt: Math.floor(params.expiresAt.getTime() / 1000),
      issuedAt: Math.floor(now.getTime() / 1000),
    };

    const signature = this.sign(payload);

    // Create signed data (base64 encoded)
    const signedData = {
      p: payload,
      s: signature,
    };
    const qrData = Buffer.from(JSON.stringify(signedData)).toString('base64url');

    // Generate QR code as base64 PNG
    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      qrCode,
      qrData,
      expiresAt: params.expiresAt,
    };
  }

  /**
   * QR 데이터 검증 및 파싱
   */
  verifyQRData(qrData: string): QRVerifyResult {
    try {
      // Decode base64url
      const decoded = Buffer.from(qrData, 'base64url').toString('utf-8');
      const { p: payload, s: signature } = JSON.parse(decoded) as {
        p: CustomerCouponQRPayload;
        s: string;
      };

      // Verify type
      if (payload.type !== 'CUSTOMER_COUPON') {
        return { valid: false, error: 'Invalid QR type' };
      }

      // Verify signature
      if (!this.verify(payload, signature)) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.expiresAt < now) {
        return { valid: false, error: 'QR code expired', payload };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Invalid QR data format' };
    }
  }

  /**
   * QR 코드 유효 시간 (기본 10분)
   */
  getQRExpirationTime(couponExpiresAt: Date): Date {
    const now = new Date();
    const qrExpires = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    // QR은 쿠폰 만료일 이전까지만 유효
    if (qrExpires > couponExpiresAt) {
      return couponExpiresAt;
    }

    return qrExpires;
  }
}

export const qrService = new QRService();
