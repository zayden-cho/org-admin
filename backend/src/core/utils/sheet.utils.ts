/**
 * 컬럼 인덱스를 문자로 변환 (0 → A, 1 → B, ...)
 * @param column 컬럼 인덱스 (0-based)
 * @returns 컬럼 문자 (A, B, ..., Z, AA, AB, ...)
 */
export function columnToLetter(column: number): string {
    let temp: number;
    let letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}

/**
 * Sleep 유틸리티 - Promise 기반 대기
 * @param ms 대기 시간 (밀리초)
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 시트 이름 포맷팅 (특수문자 제거, 길이 제한)
 * @param name 원본 시트 이름
 * @param maxLen 최대 길이 (기본값: 100)
 * @returns 정규화된 시트 이름
 */
export function formatSheetName(name: string, maxLen: number = 100): string {
    let sheetName = String(name).trim();

    // Google Sheets에서 허용하지 않는 문자 제거: : \ / ? * [ ]
    sheetName = sheetName.replace(/[:\\/?*[\]]/g, " ");

    // 연속된 공백을 하나로
    sheetName = sheetName.replace(/\s+/g, " ").trim();

    // 빈 문자열 처리
    if (!sheetName) {
        sheetName = "미지정";
    }

    // 길이 제한
    if (sheetName.length > maxLen) {
        sheetName = sheetName.slice(0, maxLen).trim();
    }

    return sheetName;
}
