import { Context } from 'hono';

import { krewsService } from '@/features/krews/krews.service';

export class KrewsController {
    /**
     * GET /api/krews?refresh=true
     * 전체 조합원 목록
     */
    async getAllKrews(c: Context) {
        try {
            const forceRefresh = c.req.query('refresh') === 'true';

            const krews = await krewsService.getAllKrews(forceRefresh);

            return c.json({
                success: true,
                data: krews,
                total: krews.length,
                timestamp: new Date().toISOString(),
                cached: !forceRefresh,
            });

        } catch (error) {
            console.error('Get all krews error:', error);

            return c.json({
                success: false,
                error: '조합원 목록을 가져올 수 없습니다.',
            }, 500);
        }
    }
}

export const krewsController = new KrewsController();
