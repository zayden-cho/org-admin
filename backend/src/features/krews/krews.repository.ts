import { GOOGLE_SPREADSHEET_IDS } from '@/core/config/google.config';
import { SheetsRepository } from '@/core/repositories/sheets.repository';
import { SheetData } from "@/core/types/sheets.types";

export class KrewsRepository extends SheetsRepository {
    constructor() {
        super({
            spreadsheetId: GOOGLE_SPREADSHEET_IDS.KREWS_TARGET,
        });
    }

    /**
     * Krews 데이터 범위 (A~P 컬럼)
     */
    async getKrewsSheetData(sheetName: string): Promise<SheetData> {
        return this.getSheetData(sheetName, 'A:P');
    }

    /**
     * 모든 Krews 시트 데이터
     */
    async getAllKrewsSheetsData(): Promise<Map<string, SheetData>> {
        return this.getAllSheetsData('A:P');
    }
}
