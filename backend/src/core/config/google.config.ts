// ========================================
// Google Calendar Configuration
// ========================================
export const GOOGLE_CALENDAR_IDS = {
    MAIN: process.env.GOOGLE_CALENDAR_ID,
} as const;

// ========================================
// Google Credentials Path
// ========================================
export const GOOGLE_CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH;

// ========================================
// Google Spreadsheet IDs
// ========================================
export const GOOGLE_SPREADSHEET_IDS = {
    // 조합원 타겟 시트
    KREWS_TARGER: process.env.GOOGLE_TARGET_SHEET_ID,

    // 조합원 원본 시트
    KREWS_SOURCE: process.env.GOOGLE_SOURCE_SHEET_ID,

    // 코나카드 시트
    KONACARD: process.env.GOOGLE_KONACARD_SHEET_ID,

    // 굿즈 시트 (미사용)
    GOODS: process.env.GOOGLE_GOODS_SHEET_ID,
} as const;
