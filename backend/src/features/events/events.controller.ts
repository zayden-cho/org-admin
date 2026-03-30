import type { Context } from 'hono';

import { eventsService } from '@/features/events/events.service';

export class EventsController {
    /**
     * GET /api/events
     * 전체 행사 목록 조회
     */
    async getEvents(c: Context) {
        try {
            const forceRefresh = c.req.query('refresh') === 'true';

            const events = await eventsService.getEvents(forceRefresh);

            return c.json({
                success: true,
                data: events,
                total: events.length,
                cached: !forceRefresh
            });

        } catch (error) {
            console.error('Failed to fetch events:', error);
            return c.json({
                success: false,
                error: '행사 목록을 가져올 수 없습니다.'
            }, 500);
        }
    }

    /**
     * GET /api/events/:eventId
     * 특정 행사 조회
     */
    async getEventById(c: Context) {
        try {
            const eventId = c.req.param('eventId');

            if (!eventId) {
                return c.json({
                    success: false,
                    error: 'eventId 파라미터가 필요합니다.'
                }, 400);
            }

            const event = await eventsService.getEventById(eventId);

            if (!event) {
                return c.json({
                    success: false,
                    error: '행사를 찾을 수 없습니다.'
                }, 404);
            }

            return c.json({
                success: true,
                data: event
            });

        } catch (error) {
            console.error('Failed to fetch event:', error);
            return c.json({
                success: false,
                error: '행사 정보를 가져올 수 없습니다.'
            }, 500);
        }
    }

    /**
     * GET /api/events/:eventId/schedules
     * 행사 일정 조회
     */
    async getEventSchedules(c: Context) {
        try {
            const eventId = c.req.param('eventId');
            const forceRefresh = c.req.query('refresh') === 'true';

            if (!eventId) {
                return c.json({
                    success: false,
                    error: 'eventId 파라미터가 필요합니다.'
                }, 400);
            }

            const schedules = await eventsService.getEventSchedules(eventId, forceRefresh);

            return c.json({
                success: true,
                data: schedules,
                total: schedules.length
            });

        } catch (error) {
            console.error('Failed to fetch event schedules:', error);
            return c.json({
                success: false,
                error: '행사 일정을 가져올 수 없습니다.'
            }, 500);
        }
    }

    /**
     * GET /api/events/:eventId/applications/:year
     * 행사 참가 신청 조회
     */
    async getEventApplications(c: Context) {
        try {
            const eventId = c.req.param('eventId');
            const year = c.req.param('year');
            const forceRefresh = c.req.query('refresh') === 'true';

            if (!eventId) {
                return c.json({
                    success: false,
                    error: 'eventId 파라미터가 필요합니다.'
                }, 400);
            }

            if (!year) {
                return c.json({
                    success: false,
                    error: 'year 파라미터가 필요합니다.'
                }, 400);
            }

            const applications = await eventsService.getEventApplications(eventId, year, forceRefresh);

            return c.json({
                success: true,
                data: applications,
                total: applications.length,
                eventId,
                year
            });

        } catch (error) {
            console.error('Failed to fetch applications:', error);
            return c.json({
                success: false,
                error: '참가 신청 목록을 가져올 수 없습니다.'
            }, 500);
        }
    }

    /**
     * GET /api/events/:eventId/statistics/:year
     * 행사별 통계 조회
     */
    async getEventStatistics(c: Context) {
        try {
            const eventId = c.req.param('eventId');
            const year = c.req.param('year');
            const forceRefresh = c.req.query('refresh') === 'true';

            if (!eventId) {
                return c.json({
                    success: false,
                    error: 'eventId 파라미터가 필요합니다.'
                }, 400);
            }

            if (!year) {
                return c.json({
                    success: false,
                    error: 'year 파라미터가 필요합니다.'
                }, 400);
            }

            const statistics = await eventsService.getEventStatistics(eventId, year, forceRefresh);

            return c.json({
                success: true,
                data: statistics
            });

        } catch (error) {
            console.error('Failed to fetch event statistics:', error);
            return c.json({
                success: false,
                error: '행사 통계를 가져올 수 없습니다.'
            }, 500);
        }
    }

    /**
     * GET /api/events/:eventId/years
     * 행사의 연도 목록 조회 (스프레드시트의 시트명)
     */
    async getEventYears(c: Context) {
        try {
            const eventId = c.req.param('eventId');
            const forceRefresh = c.req.query('refresh') === 'true';

            if (!eventId) {
                return c.json({
                    success: false,
                    error: 'eventId 파라미터가 필요합니다.'
                }, 400);
            }

            const years = await eventsService.getEventYears(eventId, forceRefresh);

            return c.json({
                success: true,
                data: years
            });

        } catch (error) {
            console.error('Failed to fetch event years:', error);
            return c.json({
                success: false,
                error: '행사 연도 목록을 가져올 수 없습니다.'
            }, 500);
        }
    }

    /**
     * POST /api/events/cache/clear
     * 캐시 클리어
     */
    async clearCache(c: Context) {
        try {
            eventsService.clearCache();

            return c.json({
                success: true,
                message: '캐시가 클리어되었습니다.'
            });

        } catch (error) {
            console.error('Failed to clear cache:', error);
            return c.json({
                success: false,
                error: '캐시 클리어에 실패했습니다.'
            }, 500);
        }
    }
}

export const eventsController = new EventsController();
