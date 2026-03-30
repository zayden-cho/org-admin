import { Hono } from 'hono';

import { zValidator } from '@hono/zod-validator';

import { eventsController } from '@/features/events/events.controller';
import { GetEventsQuerySchema, GetEventByIdParamSchema, GetEventSchedulesParamSchema, GetEventApplicationsParamSchema, GetUserEventStatsParamSchema } from '@/features/events/events.schemas';

const eventsRouter = new Hono();

// GET /api/events - 전체 행사 목록
eventsRouter.get(
    '/',
    zValidator('query', GetEventsQuerySchema),
    (c) => eventsController.getEvents(c)
);

// GET /api/events/:eventId - 특정 행사 조회
eventsRouter.get(
    '/:eventId',
    zValidator('param', GetEventByIdParamSchema),
    (c) => eventsController.getEventById(c)
);

// GET /api/events/:eventId/schedules - 행사 일정 조회
eventsRouter.get(
    '/:eventId/schedules',
    zValidator('param', GetEventSchedulesParamSchema),
    (c) => eventsController.getEventSchedules(c)
);

// GET /api/events/:eventId/applications/:year - 참가 신청 조회
eventsRouter.get(
    '/:eventId/applications/:year',
    zValidator('param', GetEventApplicationsParamSchema),
    (c) => eventsController.getEventApplications(c)
);

// POST /api/events/cache/clear - 캐시 클리어
eventsRouter.post(
    '/cache/clear',
    (c) => eventsController.clearCache(c)
);

export default eventsRouter;
