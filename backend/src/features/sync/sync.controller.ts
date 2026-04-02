import { Context } from 'hono';

import { syncService } from '@/features/sync/sync.service';

export class SyncController {
    /**
     * POST /api/sync/krews
     * 전체 조합원 갱신
     */
    async syncAllKrews(c: Context) {
        try {
            const result = await syncService.syncAllKrews();

            return c.json({
                success: result.success,
                message: result.message,
                count: result.count,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('전체 조합원 갱신 실패:', error);

            return c.json({
                success: false,
                error: '전체 조합원 갱신 중 오류가 발생했습니다.'
            }, 500);
        }
    }

    /**
     * POST /api/sync/konacards
     * 전체 코나카드 갱신
     */
    async syncAllKonacards(c: Context) {
        try {
            const result = await syncService.syncAllKonacards();

            return c.json({
                success: result.success,
                message: result.message,
                count: result.count,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('전체 코나카드 갱신 실패:', error);

            return c.json({
                success: false,
                error: '전체 코나카드 갱신 중 오류가 발생했습니다.'
            }, 500);
        }
    }
}

export const syncController = new SyncController();
