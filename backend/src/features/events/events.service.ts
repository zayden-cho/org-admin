import { createEventRepository, eventMasterRepository } from '@/features/events/events.repository';
import type { Event, EventSchedule, EventApplication, EventUserStats, EventWithSchedules } from '@/features/events/events.types';

/**
 * 행사 관리 서비스
 */
export class EventsService {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheTTL: number;

    constructor(cacheTTL: number = 5 * 60 * 1000) {
        this.cacheTTL = cacheTTL;
    }

    /**
     * 캐시 체크
     */
    private getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }

        return cached.data as T;
    }

    /**
     * 캐시 저장
     */
    private setCache(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 캐시 클리어
     */
    clearCache(pattern?: string): void {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * 전체 행사 목록 조회 (일정 정보 포함)
     */
    async getEvents(forceRefresh: boolean = false): Promise<EventWithSchedules[]> {
        const cacheKey = 'events:all:with-schedules';

        if (!forceRefresh) {
            const cached = this.getCached<EventWithSchedules[]>(cacheKey);
            if (cached) {
                console.log('Cache hit: events with schedules');
                return cached;
            }
        }

        console.log('Fetching events with schedules from sheet...');

        // 행사 목록 조회
        const events = await eventMasterRepository.getEvents();

        // 모든 일정 조회
        const allSchedules = await eventMasterRepository.getEventSchedules();

        // 현재 날짜
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 각 행사에 다음 일정 추가
        const eventsWithSchedules: EventWithSchedules[] = events.map(event => {
            // 해당 행사의 일정들
            const eventSchedules = allSchedules.filter(s => s.eventId === event.eventId);

            // 다음 일정 찾기 (오늘 이후 가장 가까운 일정)
            const nextSchedule = eventSchedules
                .filter(s => s.eventDate >= today)
                .sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0];

            // 총 참여자 수 (최근 일정의 신청자 수)
            const totalParticipants = eventSchedules.length > 0
                ? eventSchedules.reduce((sum, s) => sum + s.applicantCount, 0) / eventSchedules.length
                : 0;

            return {
                ...event,
                nextSchedule,
                totalParticipants: Math.round(totalParticipants)
            };
        });

        this.setCache(cacheKey, eventsWithSchedules);
        return eventsWithSchedules;
    }

    /**
     * 특정 행사 조회
     */
    async getEventById(eventId: string): Promise<Event | null> {
        const events = await this.getEvents();
        return events.find(e => e.eventId === eventId) || null;
    }

    /**
     * 행사 일정 조회
     */
    async getEventSchedules(eventId?: string, forceRefresh: boolean = false): Promise<EventSchedule[]> {
        const cacheKey = eventId ? `schedules:${eventId}` : 'schedules:all';

        if (!forceRefresh) {
            const cached = this.getCached<EventSchedule[]>(cacheKey);
            if (cached) {
                console.log(`Cache hit: ${cacheKey}`);
                return cached;
            }
        }

        console.log(`Fetching schedules from sheet...`);
        const schedules = await eventMasterRepository.getEventSchedules(eventId);
        this.setCache(cacheKey, schedules);

        return schedules;
    }

    /**
     * 조합원 행사 통계 조회
     */
    async getUserEventStats(krewId: string, year?: string, forceRefresh: boolean = false): Promise<EventUserStats[]> {
        const cacheKey = `user:stats:${krewId}:${year || 'all'}`;

        if (!forceRefresh) {
            const cached = this.getCached<EventUserStats[]>(cacheKey);
            if (cached) {
                console.log(`Cache hit: ${cacheKey}`);
                return cached;
            }
        }

        console.log(`Fetching user stats from sheet...`);
        const currentYear = year || new Date().getFullYear().toString();
        const stats = await eventMasterRepository.getUserEventStats(krewId, currentYear);

        this.setCache(cacheKey, stats);
        return stats;
    }

    /**
     * 행사 참가 신청 조회
     */
    async getEventApplications(
        eventId: string,
        year: string,
        forceRefresh: boolean = false
    ): Promise<EventApplication[]> {
        const event = await this.getEventById(eventId);
        if (!event) {
            throw new Error('행사를 찾을 수 없습니다');
        }

        const cacheKey = `applications:${eventId}:${year}`;

        if (!forceRefresh) {
            const cached = this.getCached<EventApplication[]>(cacheKey);
            if (cached) {
                console.log(`Cache hit: ${cacheKey}`);
                return cached;
            }
        }

        console.log(`Fetching applications for ${event.name} ${year}...`);
        const repository = createEventRepository(event.spreadsheetId);
        const applications = await repository.getApplications(year);

        this.setCache(cacheKey, applications);
        return applications;
    }

    /**
     * 행사별 통계 조회
     */
    async getEventStatistics(
        eventId: string,
        year: string,
        forceRefresh: boolean = false
    ): Promise<{
        eventId: string;
        eventName: string;
        year: string;
        totalApplied: number;
        totalAttended: number;
        totalCancelled: number;
        totalNoShow: number;
        attendanceRate: number;
        cancellationRate: number;
        noShowRate: number;
        byStatus: Record<string, number>;
        monthlyStats: Array<{
            month: string;
            applied: number;
            attended: number;
            cancelled: number;
            noShow: number;
            attendanceRate: number;
        }>;
    }> {
        const cacheKey = `statistics:${eventId}:${year}`;

        if (!forceRefresh) {
            const cached = this.getCached<any>(cacheKey);
            if (cached) {
                console.log(`Cache hit: ${cacheKey}`);
                return cached;
            }
        }

        console.log(`Calculating statistics for event ${eventId} ${year}...`);

        // 행사 정보 조회
        const event = await this.getEventById(eventId);
        if (!event) {
            throw new Error('행사를 찾을 수 없습니다');
        }

        // 신청 데이터 조회
        const applications = await this.getEventApplications(eventId, year, forceRefresh);

        // 상태별 집계
        const byStatus: Record<string, number> = {};
        applications.forEach(app => {
            const status = app.status || '미정';
            byStatus[status] = (byStatus[status] || 0) + 1;
        });

        // 기본 통계
        const totalApplied = applications.length;
        const totalAttended = byStatus['참석'] || 0;
        const totalCancelled = byStatus['신청취소'] || 0;
        const totalNoShow = byStatus['노쇼'] || 0;

        const attendanceRate = totalApplied > 0 ? Math.round((totalAttended / totalApplied) * 100 * 100) / 100 : 0;
        const cancellationRate = totalApplied > 0 ? Math.round((totalCancelled / totalApplied) * 100 * 100) / 100 : 0;
        const noShowRate = totalApplied > 0 ? Math.round((totalNoShow / totalApplied) * 100 * 100) / 100 : 0;

        // 월별 통계
        const monthlyData: Record<string, { applied: number; attended: number; cancelled: number; noShow: number }> = {};

        applications.forEach(app => {
            const month = app.month;
            if (!monthlyData[month]) {
                monthlyData[month] = { applied: 0, attended: 0, cancelled: 0, noShow: 0 };
            }

            monthlyData[month].applied++;

            if (app.status === '참석') {
                monthlyData[month].attended++;
            } else if (app.status === '신청취소') {
                monthlyData[month].cancelled++;
            } else if (app.status === '노쇼') {
                monthlyData[month].noShow++;
            }
        });

        const monthlyStats = Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                applied: data.applied,
                attended: data.attended,
                cancelled: data.cancelled,
                noShow: data.noShow,
                attendanceRate: data.applied > 0 ? Math.round((data.attended / data.applied) * 100 * 100) / 100 : 0
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const statistics = {
            eventId,
            eventName: event.name,
            year,
            totalApplied,
            totalAttended,
            totalCancelled,
            totalNoShow,
            attendanceRate,
            cancellationRate,
            noShowRate,
            byStatus,
            monthlyStats
        };

        this.setCache(cacheKey, statistics);
        return statistics;
    }

    /**
     * 행사의 연도 목록 조회 (스프레드시트의 시트명)
     * "참여통계" 시트 제외
     */
    async getEventYears(eventId: string, forceRefresh: boolean = false): Promise<string[]> {
        const cacheKey = `years:${eventId}`;

        if (!forceRefresh) {
            const cached = this.getCached<string[]>(cacheKey);
            if (cached) {
                console.log(`Cache hit: ${cacheKey}`);
                return cached;
            }
        }

        console.log(`Fetching sheet names for event ${eventId}...`);

        // 행사 정보 조회
        const event = await this.getEventById(eventId);
        if (!event) {
            throw new Error('행사를 찾을 수 없습니다');
        }

        // 스프레드시트의 시트 목록 조회
        const repository = createEventRepository(event.spreadsheetId);
        const sheetNames = await repository.getSheetNames();

        // "참여통계" 제외하고 반환
        const years = sheetNames.filter(name => name !== '참여통계');

        this.setCache(cacheKey, years);
        return years;
    }
}

export const eventsService = new EventsService(
    Number(process.env.CACHE_TTL || 5) * 60 * 1000
);
