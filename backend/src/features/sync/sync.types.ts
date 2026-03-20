import { CellValue } from '@/core/types/sheets.types';

export interface KonacardData {
    cardNumber: string;
    appRegistered: string;
}

export interface SourceRow {
    sourceId: CellValue;
    corp: string;
    name: string;
    ldap: string;
    phoneNumber: string;
    checkoffStatus: string;
    cmsStatus: string;
}

export interface SheetItem {
    corpString: string;
    rows: SourceRow[];
}
