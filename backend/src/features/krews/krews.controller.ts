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

            const result = await krewsService.getAllKrews(forceRefresh);

            return c.json({
                success: true,
                data: result.data,
                total: result.data.length,
                timestamp: new Date().toISOString(),
                cached: result.fromCache,
            });
        } catch (error) {
            console.error('Get all krews error:', error);

            return c.json({
                success: false,
                error: '조합원 목록을 가져올 수 없습니다.',
            }, 500);
        }
    }

    /**
     * GET /api/krews/corp/:corp
     * 법인별 조합원 목록
     */
    async getKrewsByCorp(c: Context) {
        try {
            const corp = c.req.param('corp');

            const result = await krewsService.getKrewsByCorp(corp);

            return c.json({
                success: true,
                data: result,
                total: result.length,
                corp,
            });

        } catch (error) {
            console.error('Get krews by corp error:', error);

            return c.json({
                success: false,
                error: '법인별 조합원 목록을 가져올 수 없습니다.',
            }, 500);
        }
    }

    /**
     * GET /api/krews/detail/:id
     * 조합원 상세
     */
    async getKrewById(c: Context) {
        try {
            const id = c.req.param('id');

            const result = await krewsService.getKrewById(id);

            if (!result) {
                return c.json({
                    success: false,
                    error: '조합원을 찾을 수 없습니다.',
                }, 404);
            }

            return c.json({
                success: true,
                data: result,
            });

        } catch (error) {
            console.error('Get krew by id error:', error);

            return c.json({
                success: false,
                error: '조합원 정보를 가져올 수 없습니다.',
            }, 500);
        }
    }

    /**
     * POST /api/krews/sync
     * 캐시 강제 갱신
     */
    async syncKrews(c: Context) {
        try {
            const result = await krewsService.syncKrews();

            return c.json({
                success: true,
                message: '조합원 정보가 갱신되었습니다.',
                updated: result.updated,
            });
        } catch (error) {
            console.error('Sync krews error:', error);

            return c.json({
                success: false,
                error: '조합원 갱신에 실패했습니다.',
            }, 500);
        }
    }
}

export const krewsController = new KrewsController();
