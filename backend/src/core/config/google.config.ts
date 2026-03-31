// ========================================
// Google Calendar Configuration
// ========================================
const calendarId = process.env.GOOGLE_CALENDAR_ID;
if (!calendarId) {
    throw new Error('GOOGLE_CALENDAR_ID environment variable is required');
}

export const GOOGLE_CALENDAR_IDS = {
    MAIN: calendarId,
} as const;

// ========================================
// Google Credentials Path
// ========================================
// Base64 환경변수가 있으면 파일 경로는 선택 사항
const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || '';

export const GOOGLE_CREDENTIALS_PATH = credentialsPath;

// ========================================
// Google Spreadsheet IDs
// ========================================
const targetSheetId = process.env.GOOGLE_TARGET_SHEET_ID;
const sourceSheetId = process.env.GOOGLE_SOURCE_SHEET_ID;
const konacardSheetId = process.env.GOOGLE_KONACARD_SHEET_ID;
const goodsSheetId = process.env.GOOGLE_GOODS_SHEET_ID;
const eventSheetId = process.env.GOOGLE_EVENT_SHEET_ID;

if (!targetSheetId) {
    throw new Error('GOOGLE_TARGET_SHEET_ID environment variable is required');
}
if (!sourceSheetId) {
    throw new Error('GOOGLE_SOURCE_SHEET_ID environment variable is required');
}
if (!konacardSheetId) {
    throw new Error('GOOGLE_KONACARD_SHEET_ID environment variable is required');
}
if (!goodsSheetId) {
    throw new Error('GOOGLE_GOODS_SHEET_ID environment variable is required');
}
if (!eventSheetId) {
    throw new Error('GOOGLE_EVENT_SHEET_ID environment variable is required');
}

export const GOOGLE_SPREADSHEET_IDS = {
    // 조합원 타겟 시트
    KREWS_TARGET: targetSheetId,

    // 조합원 원본 시트
    KREWS_SOURCE: sourceSheetId,

    // 코나카드 시트
    KONACARD: konacardSheetId,

    // 굿즈 시트
    GOODS: goodsSheetId,

    // 행사 시트
    EVENT: eventSheetId,
} as const;
