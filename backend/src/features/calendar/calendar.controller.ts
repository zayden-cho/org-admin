import { Context } from 'hono';

import { calendarService } from '@/features/calendar/calendar.service';

export class CalendarController {
    /**
     * 전체 이벤트 조회
     */
    static async getEvents(c: Context) {
        try {
            const forceRefresh = c.req.query('refresh') === 'true';
            const events = await calendarService.getAllEvents(forceRefresh);

            return c.json({
                success: true,
                data: events,
                cached: !forceRefresh,
            });
        } catch (error: any) {
            console.error('Calendar fetch error:', error);
            return c.json({
                success: false,
                error: error.message,
            }, 500);
        }
    }

    /**
     * 특정 월 이벤트 조회
     */
    static async getMonthEvents(c: Context) {
        try {
            const year = parseInt(c.req.param('year'));
            const month = parseInt(c.req.param('month'));

            if (isNaN(year) || isNaN(month)) {
                return c.json({
                    success: false,
                    error: 'Invalid year or month',
                }, 400);
            }

            const events = await calendarService.getMonthEvents(year, month);

            return c.json({
                success: true,
                data: events,
            });
        } catch (error: any) {
            console.error('Month events fetch error:', error);
            return c.json({
                success: false,
                error: error.message,
            }, 500);
        }
    }

    /**
     * 캐시 초기화
     */
    static async clearCache(c: Context) {
        try {
            calendarService.clearCache();

            return c.json({
                success: true,
                message: 'Calendar cache cleared',
            });
        } catch (error: any) {
            return c.json({
                success: false,
                error: error.message,
            }, 500);
        }
    }
}
