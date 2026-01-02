import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

/**
 * Multipart 파일 업로드 플러그인
 */
export default fp(async (app: FastifyInstance) => {
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 5, // 최대 5개 파일
      fieldSize: 1024 * 1024, // 필드당 1MB
    },
    attachFieldsToBody: false,
  });
});
