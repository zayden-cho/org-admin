import { CellValue } from '@/core/types/sheets.types';

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

export interface KonacardItem {
    name: string;
    empNo: string;
    cardNumber: string;
    appRegistered: string;
}

export interface NotFoundKonacardItem {
    corp: string;
    name: string;
    empNo: string;
    cardNumber: string;
}
