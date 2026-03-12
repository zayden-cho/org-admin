import { Hono } from 'hono';

import { zValidator } from '@hono/zod-validator';

import { CalendarController } from '@/features/calendar/calendar.controller';
import { GetEventsQuerySchema, GetMonthEventsParamSchema } from '@/features/calendar/calendar.schemas';

const calendarRouter = new Hono();

// GET /api/calendar/events?refresh=true
calendarRouter.get(
    '/events',
    zValidator('query', GetEventsQuerySchema),
    CalendarController.getEvents
);

// GET /api/calendar/month/:year/:month
calendarRouter.get(
    '/month/:year/:month',
    zValidator('param', GetMonthEventsParamSchema),
    CalendarController.getMonthEvents
);

// POST /api/calendar/cache/clear
calendarRouter.post('/cache/clear', CalendarController.clearCache);

export default calendarRouter;
