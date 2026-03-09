import { GOOGLE_CALENDAR_IDS } from '@/core/config/google.config';
import { CalendarRepository as CoreCalendarRepository } from '@/core/repositories/calendar.repository';

export class CalendarRepository extends CoreCalendarRepository {
    constructor() {
        super({
            calendarId: GOOGLE_CALENDAR_IDS.MAIN,
        });
    }

    /**
     * 다음 30일 이벤트 (캐싱용)
     */
    async getUpcomingEventsForCache() {
        return this.getUpcomingEvents();
    }

    /**
     * 특정 월 이벤트 (캐싱용)
     */
    async getMonthEventsForCache(year: number, month: number) {
        return this.getMonthEvents(year, month);
    }
}