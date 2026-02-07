export const GOOGLE_CALENDAR_IDS = {
    MAIN: 'nacjoong.jo@gmail.com',
} as const;

export const GOOGLE_CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || 'src/core/config/credentials.json';

export const GOOGLE_SPREADSHEET_IDS = {
    // 조합원 타겟 시트
    KREWS_TARGER: '1GfmilLbfKl9HPorO4dU-Dl41C8zlAy3p7yQx1tmO3Fs',

    // 조합원 원본 시트
    KREWS_SOURCE: '',

    // 코나카드 시트
    KONACARD: '',

    // 굿즈 시트
    GOODS: '',
} as const;
