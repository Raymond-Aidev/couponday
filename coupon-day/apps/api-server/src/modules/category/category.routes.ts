import type { FastifyInstance } from 'fastify';
import { prisma } from '../../database/prisma.js';
import { sendSuccess } from '../../common/utils/response.js';

export async function categoryRoutes(app: FastifyInstance) {
  // Get all categories
  app.get('/categories', {
    schema: {
      description: '점포 카테고리 목록 조회',
      tags: ['Category'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  nameEn: { type: 'string' },
                  icon: { type: 'string' },
                  displayOrder: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    const categories = await prisma.storeCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        icon: true,
        displayOrder: true,
      },
    });

    return sendSuccess(reply, categories);
  });
}
