// 행사목록 (Sheet 1)
export interface Event {
    eventId: string;
    spreadsheetId: string;
    이름: string;
    유형: string;
    주기: string;
    createdAt: string;
}

// 행사일정 (Sheet 2)
export interface EventSchedule {
    scheduleId: string;
    eventId: string;
    행사일: string;
    장소: string;
    참가_신청_시작일: string;
    참가_신청_마감일: string;
    정원: number;
    신청자_수: number;
    상태: string;
    createdAt: string;
}

// 행사통계 (Sheet 3)
export interface EventUserStats {
    krewId: string;
    eventId: string;
    year: string;
    참여횟수: number;
    최근참여일: string;
}

// ========== 행사 상세 DB ==========

// 참여통계 (Sheet 1)
export interface EventMonthlyStats {
    year: string;
    month: string;
    응답인원: number;
    신청인원: number;
    취소인원: number;
    실제_참석인원: number;
    노쇼인원: number;
    평균참여율: string;
}

// 2026/2025 (Sheet 2/3)
export interface EventApplication {
    recordId: string;  // ✅ applicationId → recordId
    scheduleId: string;
    month: string;
    krewId: string;
    상태: string;
    신청일: string;
    메모: string;
}

// ========== API 응답 타입 ==========

export interface EventsResponse {
    success: boolean;
    data?: Event[];
    total?: number;
    cached?: boolean;
    error?: string;
}

export interface EventSchedulesResponse {
    success: boolean;
    data?: EventSchedule[];
    total?: number;
    error?: string;
}

export interface EventUserStatsResponse {
    success: boolean;
    data?: EventUserStats[];
    error?: string;
}

export interface EventApplicationsResponse {
    success: boolean;
    data?: EventApplication[];
    total?: number;
    eventId?: string;
    year?: string;
    error?: string;
}

// ========== 유틸리티 타입 ==========

export interface EventWithSchedules extends Event {
    nextSchedule?: EventSchedule;
    totalParticipants?: number;
}

export interface SyncRequest {
    eventId: string;
    sourceSpreadsheetId: string;
    sourceSheetName: string;
    targetMonth: string;
}

export interface SyncResult {
    total: number;
    added: number;
    duplicates: number;
    errors: number;
}
