import { CalendarRepository } from '@/core/repositories/calendar.repository';
import { GOOGLE_CALENDAR_IDS } from '@/core/config/google.config';
import { CalendarEvent, CalendarEventRaw } from '@/features/calendar/calendar.types';

export class CalendarService {
    private repository: CalendarRepository;
    private cache: {
        data: CalendarEvent[] | null;
        timestamp: number;
        ttl: number;
    };

    constructor() {
        this.repository = new CalendarRepository({
            calendarId: GOOGLE_CALENDAR_IDS.MAIN,
        });

        this.cache = {
            data: null,
            timestamp: 0,
            ttl: 5 * 60 * 1000, // 5분 캐시
        };
    }

    /**
     * 캐시 유효성 확인
     */
    private isCacheValid(): boolean {
        if (!this.cache.data) return false;

        const now = Date.now();
        const age = now - this.cache.timestamp;

        return age < this.cache.ttl;
    }

    /**
     *  캐시 초기화 (추가)
     */
    clearCache(): void {
        this.cache.data = null;
        this.cache.timestamp = 0;
        console.log('Calendar cache cleared');
    }

    /**
     *  이벤트 타입 분류
     */
    private getEventType(summary: string): 'meeting' | 'event' | 'assembly' | 'other' {
        const lowerSummary = summary?.toLowerCase() || '';

        if (lowerSummary.includes('회의')) return 'meeting';
        if (lowerSummary.includes('행사')) return 'event';
        if (lowerSummary.includes('총회')) return 'assembly';

        return 'other';
    }

    /**
     *  이벤트 색상 매핑
     */
    private getEventColor(type: 'meeting' | 'event' | 'assembly' | 'other'): string {
        const colorMap: Record<'meeting' | 'event' | 'assembly' | 'other', string> = {
            meeting: '#3b82f6',
            event: '#10b981',
            assembly: '#8b5cf6',
            other: '#6b7280',
        };

        return colorMap[type];
    }

    /**
     *  Raw 데이터 변환 (수정)
     */
    private transformEvents(rawEvents: CalendarEventRaw[]): CalendarEvent[] {
        return rawEvents.map(event => {
            const type = this.getEventType(event.summary || '');
            const color = this.getEventColor(type);

            return {
                id: event.id || '',
                title: event.summary || '제목 없음',
                description: event.description || undefined,
                start: event.start?.dateTime || event.start?.date || '',
                end: event.end?.dateTime || event.end?.date || undefined,
                backgroundColor: color,
                borderColor: color,
                type,
            };
        }).filter(event => event.start !== '');  // start 없는 이벤트 제외
    }

    /**
     * 전체 이벤트 조회
     */
    async getAllEvents(forceRefresh: boolean = false): Promise<CalendarEvent[]> {
        if (!forceRefresh && this.isCacheValid()) {
            return this.cache.data!;
        }

        const rawEvents = await this.repository.getUpcomingEvents();
        const events = this.transformEvents(rawEvents);

        this.cache.data = events;
        this.cache.timestamp = Date.now();

        return events;
    }

    /**
     * 특정 월의 이벤트 조회
     */
    async getMonthEvents(year: number, month: number): Promise<CalendarEvent[]> {
        const rawEvents = await this.repository.getMonthEvents(year, month);
        return this.transformEvents(rawEvents);
    }
}

export const calendarService = new CalendarService();
