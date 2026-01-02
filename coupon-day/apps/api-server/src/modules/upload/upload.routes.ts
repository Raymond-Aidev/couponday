import type { FastifyInstance } from 'fastify';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { s3Service, IMAGE_CONFIGS } from '../../common/services/s3.service.js';
import { prisma } from '../../database/prisma.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadRoutes(app: FastifyInstance) {
  // Check if S3 is available
  app.get('/store/me/images/status', {
    preHandler: storeAuthGuard,
    schema: {
      description: '이미지 업로드 서비스 상태 확인',
      tags: ['Upload'],
      security: [{ bearerAuth: [] }],
    },
  }, async (_request, reply) => {
    return sendSuccess(reply, {
      available: s3Service.isAvailable(),
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_MIME_TYPES,
    });
  });

  // Upload store logo
  app.post('/store/me/logo', {
    preHandler: storeAuthGuard,
    schema: {
      description: '점포 로고 업로드',
      tags: ['Upload'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;

    if (!s3Service.isAvailable()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'UPLOAD_001', message: '이미지 업로드 서비스를 사용할 수 없습니다' },
      });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_002', message: '파일이 필요합니다' },
      });
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_003', message: '지원하지 않는 이미지 형식입니다 (JPEG, PNG, WebP, GIF만 허용)' },
      });
    }

    // Read file buffer
    const buffer = await file.toBuffer();

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_004', message: '파일 크기가 5MB를 초과합니다' },
      });
    }

    // Upload to S3
    const config = IMAGE_CONFIGS.logo;
    const result = await s3Service.uploadImage(buffer, storeId, {
      folder: config.folder,
      filename: 'logo',
      resize: { width: config.maxWidth, height: config.maxHeight },
    });

    // Update store with new logo URL
    const imageUrl = result.cdnUrl || result.url;
    await prisma.store.update({
      where: { id: storeId },
      data: { logoUrl: imageUrl },
    });

    return sendSuccess(reply, {
      key: result.key,
      url: imageUrl,
      size: result.size,
      contentType: result.contentType,
    });
  });

  // Upload store cover image
  app.post('/store/me/cover', {
    preHandler: storeAuthGuard,
    schema: {
      description: '점포 커버 이미지 업로드',
      tags: ['Upload'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;

    if (!s3Service.isAvailable()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'UPLOAD_001', message: '이미지 업로드 서비스를 사용할 수 없습니다' },
      });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_002', message: '파일이 필요합니다' },
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_003', message: '지원하지 않는 이미지 형식입니다' },
      });
    }

    const buffer = await file.toBuffer();

    if (buffer.length > MAX_FILE_SIZE) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_004', message: '파일 크기가 5MB를 초과합니다' },
      });
    }

    const config = IMAGE_CONFIGS.cover;
    const result = await s3Service.uploadImage(buffer, storeId, {
      folder: config.folder,
      filename: 'cover',
      resize: { width: config.maxWidth, height: config.maxHeight },
    });

    const imageUrl = result.cdnUrl || result.url;
    await prisma.store.update({
      where: { id: storeId },
      data: { coverImageUrl: imageUrl },
    });

    return sendSuccess(reply, {
      key: result.key,
      url: imageUrl,
      size: result.size,
      contentType: result.contentType,
    });
  });

  // Upload menu item image
  app.post('/store/me/items/:id/image', {
    preHandler: storeAuthGuard,
    schema: {
      description: '메뉴 이미지 업로드',
      tags: ['Upload'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { id: itemId } = request.params as { id: string };

    if (!s3Service.isAvailable()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'UPLOAD_001', message: '이미지 업로드 서비스를 사용할 수 없습니다' },
      });
    }

    // Verify item belongs to store
    const item = await prisma.item.findFirst({
      where: { id: itemId, storeId },
    });

    if (!item) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ITEM_001', message: '메뉴를 찾을 수 없습니다' },
      });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_002', message: '파일이 필요합니다' },
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_003', message: '지원하지 않는 이미지 형식입니다' },
      });
    }

    const buffer = await file.toBuffer();

    if (buffer.length > MAX_FILE_SIZE) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_004', message: '파일 크기가 5MB를 초과합니다' },
      });
    }

    const config = IMAGE_CONFIGS.item;
    const result = await s3Service.uploadImage(buffer, `${storeId}/${itemId}`, {
      folder: config.folder,
      filename: 'main',
      resize: { width: config.maxWidth, height: config.maxHeight },
    });

    const imageUrl = result.cdnUrl || result.url;
    await prisma.item.update({
      where: { id: itemId },
      data: { imageUrl },
    });

    return sendSuccess(reply, {
      key: result.key,
      url: imageUrl,
      size: result.size,
      contentType: result.contentType,
    });
  });

  // Get presigned upload URL (alternative method)
  app.get('/store/me/images/presigned', {
    preHandler: storeAuthGuard,
    schema: {
      description: 'Presigned 업로드 URL 발급',
      tags: ['Upload'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['logo', 'cover', 'item', 'coupon'] },
          itemId: { type: 'string', format: 'uuid', description: '메뉴 ID (type=item인 경우)' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { type, itemId } = request.query as { type: string; itemId?: string };

    if (!s3Service.isAvailable()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'UPLOAD_001', message: '이미지 업로드 서비스를 사용할 수 없습니다' },
      });
    }

    const config = IMAGE_CONFIGS[type as keyof typeof IMAGE_CONFIGS];
    if (!config) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPLOAD_005', message: '잘못된 이미지 타입입니다' },
      });
    }

    let entityId = storeId;
    if (type === 'item' && itemId) {
      // Verify item belongs to store
      const item = await prisma.item.findFirst({
        where: { id: itemId, storeId },
      });

      if (!item) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ITEM_001', message: '메뉴를 찾을 수 없습니다' },
        });
      }
      entityId = `${storeId}/${itemId}`;
    }

    const result = await s3Service.getPresignedUploadUrl(entityId, {
      folder: config.folder,
      filename: type === 'item' ? 'main' : type,
      contentType: 'image/webp',
    });

    return sendSuccess(reply, result);
  });

  // Delete image
  app.delete('/store/me/images/:key', {
    preHandler: storeAuthGuard,
    schema: {
      description: '이미지 삭제',
      tags: ['Upload'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: 'S3 키 (URL encoded)' },
        },
      },
    },
  }, async (request, reply) => {
    const storeId = request.user!.storeId!;
    const { key } = request.params as { key: string };
    const decodedKey = decodeURIComponent(key);

    if (!s3Service.isAvailable()) {
      return reply.status(503).send({
        success: false,
        error: { code: 'UPLOAD_001', message: '이미지 업로드 서비스를 사용할 수 없습니다' },
      });
    }

    // Verify key belongs to this store
    if (!decodedKey.includes(storeId)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'UPLOAD_006', message: '이 이미지를 삭제할 권한이 없습니다' },
      });
    }

    await s3Service.deleteImage(decodedKey);

    return sendSuccess(reply, { message: '이미지가 삭제되었습니다' });
  });
}
