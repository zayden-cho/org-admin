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
const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
if (!credentialsPath) {
    throw new Error('GOOGLE_CREDENTIALS_PATH environment variable is required');
}

export const GOOGLE_CREDENTIALS_PATH = credentialsPath;

// ========================================
// Google Spreadsheet IDs
// ========================================
const targetSheetId = process.env.GOOGLE_TARGET_SHEET_ID;
const sourceSheetId = process.env.GOOGLE_SOURCE_SHEET_ID;
const konacardSheetId = process.env.GOOGLE_KONACARD_SHEET_ID;
const goodsSheetId = process.env.GOOGLE_GOODS_SHEET_ID;

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

export const GOOGLE_SPREADSHEET_IDS = {
    // 조합원 타겟 시트
    KREWS_TARGER: targetSheetId,

    // 조합원 원본 시트
    KREWS_SOURCE: sourceSheetId,

    // 코나카드 시트
    KONACARD: konacardSheetId,

    // 굿즈 시트
    GOODS: goodsSheetId,
} as const;
