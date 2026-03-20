import { GOOGLE_SPREADSHEET_IDS } from '@/core/config/google.config';
import { SheetsRepository } from '@/core/repositories/sheets.repository';
import { SheetData } from '@/core/types/sheets.types';

export class SyncRepository {
    private sourceRepository: SheetsRepository;
    private targetRepository: SheetsRepository;
    private konacardRepository: SheetsRepository;

    constructor() {
        this.sourceRepository = new SheetsRepository({
            spreadsheetId: GOOGLE_SPREADSHEET_IDS.KREWS_SOURCE,
        });

        this.targetRepository = new SheetsRepository({
            spreadsheetId: GOOGLE_SPREADSHEET_IDS.KREWS_TARGER,
        });

        this.konacardRepository = new SheetsRepository({
            spreadsheetId: GOOGLE_SPREADSHEET_IDS.KONACARD,
        });
    }

    // ========================================
    // Source (원본) 관련
    // ========================================

    async getSourceSheetData(sheetName: string): Promise<SheetData> {
        return this.sourceRepository.getSheetData(sheetName);
    }

    // ========================================
    // Target (타겟) 관련
    // ========================================

    async targetSheetExists(sheetName: string): Promise<boolean> {
        return this.targetRepository.sheetExists(sheetName);
    }

    async createTargetSheet(sheetName: string): Promise<void> {
        return this.targetRepository.createSheet(sheetName);
    }

    async getTargetSheetData(sheetName: string): Promise<SheetData> {
        return this.targetRepository.getSheetData(sheetName);
    }

    async updateTargetSheetData(
        sheetName: string,
        range: string,
        values: SheetData
    ): Promise<void> {
        return this.targetRepository.updateSheetData(sheetName, range, values);
    }

    async clearTargetRange(sheetName: string, range: string): Promise<void> {
        return this.targetRepository.clearRange(sheetName, range);
    }

    async deleteTargetRows(sheetName: string, rowIndices: number[]): Promise<void> {
        return this.targetRepository.deleteRows(sheetName, rowIndices);
    }

    async batchUpdateTargetSheet(
        sheetName: string,
        updates: Array<{ range: string; values: SheetData }>
    ): Promise<void> {
        return this.targetRepository.batchUpdateSheetData(sheetName, updates);
    }

    async formatTargetHeaderRow(sheetName: string): Promise<void> {
        return this.targetRepository.formatHeaderRow(sheetName);
    }

    async freezeTargetHeaderRow(sheetName: string): Promise<void> {
        return this.targetRepository.freezeHeaderRow(sheetName);
    }

    async autoResizeTargetColumns(
        sheetName: string,
        startColumn: number,
        endColumn: number
    ): Promise<void> {
        return this.targetRepository.autoResizeColumns(sheetName, startColumn, endColumn);
    }

    // ========================================
    // Konacard 관련
    // ========================================

    async getKonacardSheetData(sheetName: string): Promise<SheetData> {
        return this.konacardRepository.getSheetData(sheetName);
    }

    // ========================================
    // Target 시트 배치 업데이트 (청크)
    // ========================================

    async batchUpdateTargetWithChunks(
        sheetName: string,
        updates: Array<{ range: string; values: SheetData }>,
        chunkSize: number = 100
    ): Promise<void> {
        return this.targetRepository.batchUpdateWithChunks(sheetName, updates, chunkSize);
    }

    /**
     * 신규 타겟 시트 생성 + 초기화 (배치)
     */
    async createAndInitializeTargetSheet(
        sheetName: string,
        headers: string[],
        dataRows: SheetData
    ): Promise<void> {
        return this.targetRepository.createAndInitializeSheet(sheetName, headers, dataRows);
    }
}
