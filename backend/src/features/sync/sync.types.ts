import { CellValue } from '@/core/types/sheets.types';

export interface KonacardData {
    cardNumber: string;
    appRegistered: string;
}

export interface SourceRow {
    sourceId: CellValue;
    corp: CellValue;
    name: CellValue;
    ldap: CellValue;
    phoneNumber: CellValue;
    checkoffStatus: CellValue;
    cmsStatus: CellValue;
}

export interface SheetItem {
    corpString: string;
    rows: SourceRow[];
}
