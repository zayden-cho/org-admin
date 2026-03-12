import { Context } from 'hono';

import { getErrorMessage } from '@/core/types/sheets.types';
import { syncService } from '@/features/sync/sync.service';

export class SyncController {
    /**
     * POST /api/sync/all
     * 전체 조합원 갱신
     */
    async syncAllKrews(c: Context) {
        try {
            const result = await syncService.syncAllKrews();

            return c.json(result);
        } catch (error) {
            console.error('Sync all krews error:', error);

            return c.json({
                success: false,
                message: `전체 갱신 실패: ${getErrorMessage(error)}`,
            }, 500);
        }
    }

    /**
     * POST /api/sync/corp/:corp
     * 법인별 조합원 갱신
     */
    async syncCorpKrews(c: Context) {
        try {
            const corp = c.req.param('corp');

            if (!corp) {
                return c.json({
                    success: false,
                    message: '법인을 선택해주세요.',
                }, 400);
            }

            const result = await syncService.syncCorpKrews(corp);

            return c.json(result);
        } catch (error) {
            console.error('Sync corp krews error:', error);

            return c.json({
                success: false,
                message: `법인 갱신 실패: ${getErrorMessage(error)}`,
            }, 500);
        }
    }

    /**
     * POST /api/sync/konacard/:corp
     * 법인별 코나카드 갱신
     */
    async syncCorpKonacards(c: Context) {
        try {
            const corp = c.req.param('corp');

            if (!corp) {
                return c.json({
                    success: false,
                    message: '법인을 선택해주세요.',
                }, 400);
            }

            const result = await syncService.syncCorpKonacards(corp);

            return c.json(result);
        } catch (error) {
            console.error('Sync corp konacards error:', error);

            return c.json({
                success: false,
                message: `코나카드 갱신 실패: ${getErrorMessage(error)}`,
            }, 500);
        }
    }
}

export const syncController = new SyncController();

