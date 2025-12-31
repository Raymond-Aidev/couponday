import type { FastifyInstance } from 'fastify';
import { storeAuthGuard } from '../../common/guards/auth.guard.js';
import { sendSuccess } from '../../common/utils/response.js';
import { getStoreAnalytics } from './services/analytics.service.js';

export async function analyticsRoutes(app: FastifyInstance) {
    app.get('/store/me/analytics', {
        preHandler: storeAuthGuard,
        schema: {
            description: 'Get store analytics',
            tags: ['Store - Analytics'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    period: { type: 'string', enum: ['day', 'week', 'month'] },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                },
            },
        },
    }, async (request, reply) => {
        const storeId = request.user!.storeId!;
        const { period, startDate, endDate } = request.query as {
            period?: 'day' | 'week' | 'month';
            startDate?: string;
            endDate?: string;
        };

        const data = await getStoreAnalytics(storeId, { period, startDate, endDate });
        return sendSuccess(reply, data);
    });
}
