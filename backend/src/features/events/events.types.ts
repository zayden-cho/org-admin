export interface Event {
    eventId: string;
    spreadsheetId: string;
    name: string;
    type: string;
    cycle: string;
    createdAt: string;
}

export interface EventSchedule {
    scheduleId: string;
    eventId: string;
    eventDate: string;
    location: string;
    registrationStartDate: string;
    registrationEndDate: string;
    capacity: number;
    applicantCount: number;
    status: string;
    createdAt: string;
}

export interface EventUserStats {
    krewId: string;
    eventId: string;
    year: string;
    participationCount: number;
    lastParticipationDate: string;
}

// ========== 행사 상세 DB ==========
export interface EventMonthlyStats {
    year: string;
    month: string;
    responseCount: number;
    applicantCount: number;
    cancelCount: number;
    attendeeCount: number;
    noShowCount: number;
    averageAttendanceRate: string;
}

export interface EventApplication {
    recordId: string;
    scheduleId: string;
    month: string;
    krewId: string;
    status: string;
    applicationDate: string;
    notes: string;
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
