import { GOOGLE_SPREADSHEET_IDS } from '@/core/config/google.config';
import { SheetsRepository } from '@/core/repositories/sheets.repository';
import type { SheetData } from '@/core/types/sheets.types';
import type { Event, EventSchedule, EventUserStats, EventApplication, EventMonthlyStats } from '@/features/events/events.types';

/**
 * 행사 마스터 Repository (행사 DB 스프레드시트)
 */
export class EventRepository extends SheetsRepository {
    /**
     * 행사 목록 조회
     * Sheet 1: eventId / spreadsheetId / 이름 / 유형 / 주기 / createdAt
     */
    async getEvents(): Promise<Event[]> {
        const data = await this.getSheetData('행사목록');

        return data.slice(1).map(row => ({
            eventId: String(row[0] || ''),
            spreadsheetId: String(row[1] || ''),
            name: String(row[2] || ''),
            type: String(row[3] || ''),
            cycle: String(row[4] || ''),
            createdAt: String(row[5] || '')
        }));
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
     * Sheet 2: scheduleId / eventId / 행사일 / 장소 / 참가 신청 시작일 / 참가 신청 마감일 / 정원 / 신청자 수 / 상태 / createdAt
     */
    async getEventSchedules(eventId?: string): Promise<EventSchedule[]> {
        const data = await this.getSheetData('행사일정');

        const schedules = data.slice(1).map(row => ({
            scheduleId: String(row[0] || ''),
            eventId: String(row[1] || ''),
            eventDate: String(row[2] || ''),
            location: String(row[3] || ''),
            registrationStartDate: String(row[4] || ''),
            registrationEndDate: String(row[5] || ''),
            capacity: Number(row[6] || 0),
            applicantCount: Number(row[7] || 0),
            status: String(row[8] || ''),
            createdAt: String(row[9] || '')
        }));

        if (eventId) {
            return schedules.filter(s => s.eventId === eventId);
        }

        return schedules;
    }

    /**
     * 조합원 행사 통계 조회
     * Sheet 3: krewId / eventId / year / 참여횟수 / 최근참여일
     */
    async getUserEventStats(krewId?: string, year?: string): Promise<EventUserStats[]> {
        const data = await this.getSheetData('행사통계');

        let stats = data.slice(1).map(row => ({
            krewId: String(row[0] || ''),
            eventId: String(row[1] || ''),
            year: String(row[2] || ''),
            participationCount: Number(row[3] || 0),
            lastParticipationDate: String(row[4] || '')
        }));

        if (krewId) {
            stats = stats.filter(s => s.krewId === krewId);
        }

        if (year && year !== 'all') {
            stats = stats.filter(s => s.year === year);
        }

        return stats;
    }

    /**
     * 조합원 행사 통계 업데이트
     */
    async updateUserEventStats(krewId: string, eventId: string): Promise<void> {
        const currentYear = new Date().getFullYear().toString();
        const data = await this.getSheetData('행사통계');
        const rows = data.slice(1);

        // 현재 연도의 기록 찾기
        const rowIndex = rows.findIndex(row =>
            String(row[0]) === krewId &&
            String(row[1]) === eventId &&
            String(row[2]) === currentYear
        );

        if (rowIndex === -1) {
            // 신규 추가
            const newRow = [
                krewId,
                eventId,
                currentYear,
                1,  // 참여횟수
                new Date().toISOString().split('T')[0]  // 최근참여일
            ];

            await this.appendSheetData('행사통계', [newRow]);
        } else {
            // 기존 데이터 업데이트
            const existingRow = rows[rowIndex];
            existingRow[3] = Number(existingRow[3] || 0) + 1; // 참여횟수
            existingRow[4] = new Date().toISOString().split('T')[0]; // 최근참여일

            const range = `A${rowIndex + 2}:E${rowIndex + 2}`;
            await this.updateSheetData('행사통계', range, [existingRow]);
        }
    }

    /**
     * 행사 일정 추가
     */
    async addEventSchedule(schedule: Omit<EventSchedule, 'scheduleId' | 'createdAt'>): Promise<void> {
        const scheduleId = `SCH${Date.now()}`;
        const createdAt = new Date().toISOString().split('T')[0];

        const newRow = [
            scheduleId,
            schedule.eventId,
            schedule.eventDate,
            schedule.location,
            schedule.registrationStartDate,
            schedule.registrationEndDate,
            schedule.capacity,
            schedule.applicantCount,
            schedule.status,
            createdAt
        ];

        await this.appendSheetData('행사일정', [newRow]);
    }
}

/**
 * 개별 행사 스프레드시트 Repository (호프데이 등)
 */
export class EventApplicationRepository extends SheetsRepository {
    /**
     * 연도별 참가 신청 조회
     * Sheet 2/3: recordId / scheduleId / month / krewId / 상태 / 신청일 / 메모
     */
    async getApplications(year: string): Promise<EventApplication[]> {
        const data = await this.getSheetData(year);

        return data.slice(1).map(row => ({
            recordId: String(row[0] || ''),
            scheduleId: String(row[1] || ''),
            month: String(row[2] || ''),
            krewId: String(row[3] || ''),
            status: String(row[4] || ''),
            applicationDate: String(row[5] || ''),
            notes: String(row[6] || '')
        }));
    }

    /**
     * 참가 신청 추가
     */
    async addApplication(year: string, application: Omit<EventApplication, 'recordId' | 'applicationDate'>): Promise<void> {
        const recordId = `REC${Date.now()}`;
        const applicationDate = new Date().toISOString().split('T')[0];

        const newRow = [
            recordId,
            application.scheduleId,
            application.month,
            application.krewId,
            application.status,
            applicationDate,
            application.notes || ''
        ];

        await this.appendSheetData(year, [newRow]);
    }

    /**
     * 배치 추가 (GAS 싱크용)
     */
    async batchAddApplications(year: string, applications: SheetData): Promise<void> {
        await this.appendSheetData(year, applications);
    }

    /**
     * 월별 통계 조회
     * Sheet 1: year / month / 응답인원 / 신청인원 / 취소인원 / 실제 참석인원 / 노쇼인원 / 평균참여율
     */
    async getMonthlyStats(): Promise<EventMonthlyStats[]> {
        const data = await this.getSheetData('참여통계');

        return data.slice(1).map(row => ({
            year: String(row[0] || ''),
            month: String(row[1] || ''),
            responseCount: Number(row[2] || 0),
            applicantCount: Number(row[3] || 0),
            cancelCount: Number(row[4] || 0),
            attendeeCount: Number(row[5] || 0),
            noShowCount: Number(row[6] || 0),
            averageAttendanceRate: String(row[7] || '0%')
        }));
    }
}

// 싱글톤 인스턴스
export const eventMasterRepository = new EventRepository({
    spreadsheetId: GOOGLE_SPREADSHEET_IDS.EVENT
});

/**
 * 행사별 Repository 생성 함수
 */
export function createEventRepository(spreadsheetId: string): EventApplicationRepository {
    return new EventApplicationRepository({ spreadsheetId });
}
