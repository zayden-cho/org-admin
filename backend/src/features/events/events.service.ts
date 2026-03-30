// import type { SheetData } from '@/core/types/sheets.types';
import { createEventRepository, eventMasterRepository } from '@/features/events/events.repository';
// import type { Event, EventSchedule, EventApplication, EventUserStats, EventWithSchedules, SyncRequest, SyncResult } from '@/features/events/events.types';
import type { Event, EventSchedule, EventApplication, EventUserStats, EventWithSchedules } from '@/features/events/events.types';
// import { krewsRepository } from '@/features/krews/krews.repository';

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
                .filter(s => s.행사일 >= today)
                .sort((a, b) => a.행사일.localeCompare(b.행사일))[0];

            // 총 참여자 수 (최근 일정의 신청자 수)
            const totalParticipants = eventSchedules.length > 0
                ? eventSchedules.reduce((sum, s) => sum + s.신청자_수, 0) / eventSchedules.length
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

        console.log(`Fetching applications for ${event.이름} ${year}...`);
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
        총신청인원: number;
        참석인원: number;
        취소인원: number;
        노쇼인원: number;
        참석률: number;
        취소율: number;
        노쇼율: number;
        상태별분포: Record<string, number>;
        월별통계: Array<{
            month: string;
            신청: number;
            참석: number;
            취소: number;
            노쇼: number;
            참석률: number;
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
        const 상태별분포: Record<string, number> = {};
        applications.forEach(app => {
            const 상태 = app.상태 || '미정';
            상태별분포[상태] = (상태별분포[상태] || 0) + 1;
        });

        // 기본 통계
        const 총신청인원 = applications.length;
        const 참석인원 = 상태별분포['참석'] || 0;
        const 취소인원 = 상태별분포['신청취소'] || 0;
        const 노쇼인원 = 상태별분포['노쇼'] || 0;

        const 참석률 = 총신청인원 > 0 ? Math.round((참석인원 / 총신청인원) * 100 * 100) / 100 : 0;
        const 취소율 = 총신청인원 > 0 ? Math.round((취소인원 / 총신청인원) * 100 * 100) / 100 : 0;
        const 노쇼율 = 총신청인원 > 0 ? Math.round((노쇼인원 / 총신청인원) * 100 * 100) / 100 : 0;

        // 월별 통계
        const 월별데이터: Record<string, { 신청: number; 참석: number; 취소: number; 노쇼: number }> = {};

        applications.forEach(app => {
            const month = app.month;
            if (!월별데이터[month]) {
                월별데이터[month] = { 신청: 0, 참석: 0, 취소: 0, 노쇼: 0 };
            }

            월별데이터[month].신청++;

            if (app.상태 === '참석') {
                월별데이터[month].참석++;
            } else if (app.상태 === '신청취소') {
                월별데이터[month].취소++;
            } else if (app.상태 === '노쇼') {
                월별데이터[month].노쇼++;
            }
        });

        const 월별통계 = Object.entries(월별데이터)
            .map(([month, data]) => ({
                month,
                신청: data.신청,
                참석: data.참석,
                취소: data.취소,
                노쇼: data.노쇼,
                참석률: data.신청 > 0 ? Math.round((data.참석 / data.신청) * 100 * 100) / 100 : 0
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const statistics = {
            eventId,
            eventName: event.이름,
            year,
            총신청인원,
            참석인원,
            취소인원,
            노쇼인원,
            참석률,
            취소율,
            노쇼율,
            상태별분포,
            월별통계
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

    // /**
    //  * GAS 폼에서 데이터 싱크 (나중에 구현)
    //  */
    // async syncEventApplications(request: SyncRequest): Promise<SyncResult> {
    //     const { eventId, sourceSpreadsheetId, sourceSheetName, targetMonth } = request;
    //
    //     console.log(`Syncing applications for event ${eventId}, month ${targetMonth}...`);
    //
    //     // 1. 행사 정보 확인
    //     const event = await this.getEventById(eventId);
    //     if (!event) {
    //         throw new Error('행사를 찾을 수 없습니다');
    //     }
    //
    //     // TODO: Phase 2에서 구현
    //     // - GAS 임시 시트 읽기
    //     // - 조합원 검증
    //     // - 중복 체크
    //     // - 배치 추가
    //     // - 통계 업데이트
    //
    //     // 임시 응답
    //     return {
    //         total: 0,
    //         added: 0,
    //         duplicates: 0,
    //         errors: 0
    //     };
    // }
}

export const eventsService = new EventsService(
    Number(process.env.CACHE_TTL || 5) * 60 * 1000
);
