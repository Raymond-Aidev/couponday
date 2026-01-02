import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { env } from '../../config/env.js';
import { createError, ErrorCodes } from '../utils/errors.js';

/**
 * 이미지 업로드 옵션
 */
export interface UploadOptions {
  folder: 'stores' | 'items' | 'coupons' | 'customers';
  filename?: string;
  contentType?: string;
  resize?: { width: number; height: number };
  quality?: number;
}

/**
 * 업로드 결과
 */
export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  contentType: string;
}

/**
 * 이미지 타입별 설정
 */
export const IMAGE_CONFIGS = {
  logo: { maxWidth: 200, maxHeight: 200, folder: 'stores' as const },
  cover: { maxWidth: 1200, maxHeight: 400, folder: 'stores' as const },
  item: { maxWidth: 800, maxHeight: 800, folder: 'items' as const },
  coupon: { maxWidth: 600, maxHeight: 400, folder: 'coupons' as const },
  profile: { maxWidth: 300, maxHeight: 300, folder: 'customers' as const },
};

/**
 * S3 이미지 업로드 서비스
 */
class S3Service {
  private client: S3Client | null = null;
  private bucket: string;
  private region: string;
  private cdnDomain?: string;
  private initialized = false;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET || '';
    this.region = env.AWS_REGION;
    this.cdnDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
  }

  /**
   * S3 클라이언트 초기화
   */
  private initialize(): boolean {
    if (this.initialized) return this.client !== null;

    this.initialized = true;

    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !this.bucket) {
      console.warn('S3 Service: AWS credentials not configured, image upload disabled');
      return false;
    }

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    return true;
  }

  /**
   * 서비스 사용 가능 여부
   */
  isAvailable(): boolean {
    return this.initialize();
  }

  /**
   * 이미지 처리 (리사이징, 최적화)
   */
  async processImage(
    buffer: Buffer,
    options: { resize?: { width: number; height: number }; quality?: number }
  ): Promise<{ buffer: Buffer; contentType: string }> {
    let processor = sharp(buffer);

    // 리사이징
    if (options.resize) {
      processor = processor.resize(options.resize.width, options.resize.height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true,
      });
    }

    // WebP 변환 (최적 품질)
    const quality = options.quality || 80;
    const processedBuffer = await processor.webp({ quality }).toBuffer();

    return {
      buffer: processedBuffer,
      contentType: 'image/webp',
    };
  }

  /**
   * S3에 이미지 업로드
   */
  async uploadImage(
    buffer: Buffer,
    entityId: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!this.initialize() || !this.client) {
      throw createError(ErrorCodes.SERVER_001, {
        message: 'S3 서비스가 설정되지 않았습니다',
      });
    }

    // 이미지 처리
    const processed = await this.processImage(buffer, {
      resize: options.resize,
      quality: options.quality,
    });

    // 파일명 생성
    const timestamp = Date.now();
    const filename = options.filename || `image-${timestamp}`;
    const key = `${options.folder}/${entityId}/${filename}.webp`;

    // S3 업로드
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: processed.buffer,
        ContentType: processed.contentType,
        CacheControl: 'max-age=31536000', // 1년 캐시
      })
    );

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    const cdnUrl = this.cdnDomain ? `https://${this.cdnDomain}/${key}` : undefined;

    return {
      key,
      url,
      cdnUrl,
      size: processed.buffer.length,
      contentType: processed.contentType,
    };
  }

  /**
   * S3에서 이미지 삭제
   */
  async deleteImage(key: string): Promise<void> {
    if (!this.initialize() || !this.client) {
      throw createError(ErrorCodes.SERVER_001, {
        message: 'S3 서비스가 설정되지 않았습니다',
      });
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  /**
   * Presigned URL 생성 (클라이언트 직접 업로드용)
   */
  async getPresignedUploadUrl(
    entityId: string,
    options: UploadOptions,
    expiresIn = 300 // 5분
  ): Promise<{ uploadUrl: string; key: string; expiresIn: number }> {
    if (!this.initialize() || !this.client) {
      throw createError(ErrorCodes.SERVER_001, {
        message: 'S3 서비스가 설정되지 않았습니다',
      });
    }

    const timestamp = Date.now();
    const filename = options.filename || `image-${timestamp}`;
    const key = `${options.folder}/${entityId}/${filename}.webp`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options.contentType || 'image/webp',
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return { uploadUrl, key, expiresIn };
  }

  /**
   * 이미지 URL 생성
   */
  getPublicUrl(key: string): string {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * 파일 존재 여부 확인
   */
  async exists(key: string): Promise<boolean> {
    if (!this.initialize() || !this.client) {
      return false;
    }

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}

export const s3Service = new S3Service();
