import { Context } from 'hono';

import { getErrorMessage } from '@/core/types/sheets.types';
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
        } catch (error) {
            console.error('Calendar fetch error:', error);
            return c.json({
                success: false,
                error: getErrorMessage(error),
            }, 500);
        }
    }

    /**
     * 특정 월 이벤트 조회
     */
    static async getMonthEvents(c: Context) {
        try {
            const yearParam = c.req.param('year');
            const monthParam = c.req.param('month');

            if (!yearParam || !monthParam) {
                return c.json({
                    success: false,
                    error: 'Year and month are required',
                }, 400);
            }

            const year = parseInt(yearParam);
            const month = parseInt(monthParam);

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
        } catch (error) {
            console.error('Month events fetch error:', error);
            return c.json({
                success: false,
                error: getErrorMessage(error),
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
        } catch (error) {
            return c.json({
                success: false,
                error: getErrorMessage(error),
            }, 500);
        }
    }
}
