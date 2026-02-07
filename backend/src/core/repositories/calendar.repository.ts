import { google, calendar_v3 } from 'googleapis';
import path from 'path';

import { GOOGLE_CREDENTIALS_PATH } from '@/core/config/google.config';

export interface CalendarConfig {
    calendarId: string;
    credentialsPath?: string;
}

export class CalendarRepository {
    protected calendar: calendar_v3.Calendar;
    protected calendarId: string;

    constructor(config: CalendarConfig) {
        this.calendarId = config.calendarId;

        const credentialsPath = path.resolve(
            process.cwd(),
            config.credentialsPath || GOOGLE_CREDENTIALS_PATH
        );

        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });

        this.calendar = google.calendar({ version: 'v3', auth });
    }

    /**
     * 캘린더 이벤트 가져오기
     */
    async getEvents(
        timeMin?: string,
        timeMax?: string,
        maxResults: number = 50
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax,
                maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items || [];

        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
            throw new Error('캘린더 이벤트를 가져올 수 없습니다.');
        }
    }

    /**
     * 특정 기간의 이벤트 가져오기
     */
    async getEventsByDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items || [];

        } catch (error) {
            console.error('Failed to fetch events by date range:', error);
            throw new Error('날짜 범위의 이벤트를 가져올 수 없습니다.');
        }
    }

    /**
     * 다음 30일간의 이벤트
     */
    async getUpcomingEvents(): Promise<calendar_v3.Schema$Event[]> {
        const now = new Date();
        const thirtyDaysLater = new Date(now);
        thirtyDaysLater.setDate(now.getDate() + 30);

        return this.getEventsByDateRange(now, thirtyDaysLater);
    }

    /**
     * 특정 월의 이벤트
     */
    async getMonthEvents(year: number, month: number): Promise<calendar_v3.Schema$Event[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        return this.getEventsByDateRange(startDate, endDate);
    }
}
