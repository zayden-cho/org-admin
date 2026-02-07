import { Hono } from 'hono';

import { CalendarController } from '@/features/calendar/calendar.controller';

const calendar = new Hono();

calendar.get('/', CalendarController.getEvents);
calendar.get('/:year/:month', CalendarController.getMonthEvents);
calendar.post('/clear-cache', CalendarController.clearCache);

export default calendar;
