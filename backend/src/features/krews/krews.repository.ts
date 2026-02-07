import { GOOGLE_SPREADSHEET_IDS } from '@/core/config/google.config';
import { SheetsRepository } from '@/core/repositories/sheets.repository';

export class KrewsRepository extends SheetsRepository {
    constructor() {
        super({
            spreadsheetId: GOOGLE_SPREADSHEET_IDS.KREWS_TARGER,
        });
    }

    /**
     * 모든 Krews 시트 데이터
     */
    async getAllKrewsSheetsData(): Promise<Map<string, string[][]>> {
        return this.getAllSheetsData('A:P');
    }
}
