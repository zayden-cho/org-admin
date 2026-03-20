export type CellValue = string | number | boolean | null | undefined;

export type SheetRow = CellValue[];

export type SheetData = SheetRow[];

export interface BatchUpdate {
    range: string;
    values: SheetData;
}

export interface SheetsConfig {
    spreadsheetId: string;
    credentialsPath?: string;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return String(error);
}

export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

export function hasErrorCode(error: unknown): error is { code: number } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as Record<string, unknown>).code === 'number'
    );
}

export function isValidSheetRow(row: unknown): row is SheetRow {
    return (
        Array.isArray(row) &&
        row.every(
            cell =>
                typeof cell === 'string' ||
                typeof cell === 'number' ||
                typeof cell === 'boolean' ||
                cell === null ||
                cell === undefined
        )
    );
}

export function isValidSheetData(data: unknown): data is SheetData {
    return Array.isArray(data) && data.every(row => isValidSheetRow(row));
}

export function cellToString(cell: CellValue): string {
    if (cell === null || cell === undefined) {
        return '';
    }
    return String(cell);
}

export function cellToNumber(cell: CellValue): number {
    if (cell === null || cell === undefined || cell === '') {
        return 0;
    }
    const num = Number(cell);
    return isNaN(num) ? 0 : num;
}
