import { google, sheets_v4 } from 'googleapis';
import path from 'path';

import { GOOGLE_CREDENTIALS_PATH } from '@/core/config/google.config';

export interface SheetsConfig {
    spreadsheetId: string;
    credentialsPath?: string;
}

export class SheetsRepository {
    protected sheets: sheets_v4.Sheets;
    protected spreadsheetId: string;

    constructor(config: SheetsConfig) {
        this.spreadsheetId = config.spreadsheetId;

        const credentialsPath = path.resolve(
            process.cwd(),
            config.credentialsPath || GOOGLE_CREDENTIALS_PATH
        );

        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'], // 읽기 + 쓰기
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    // ========================================
    // 읽기 메서드
    // ========================================

    /**
     * 모든 시트 이름 가져오기
     */
    async getSheetNames(): Promise<string[]> {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });

            return response.data.sheets?.map(
                sheet => sheet.properties?.title || ''
            ).filter(Boolean) || [];

        } catch (error) {
            console.error('Failed to fetch sheet names:', error);
            throw new Error('시트 목록을 가져올 수 없습니다.');
        }
    }

    /**
     * 특정 시트의 데이터 가져오기
     */
    async getSheetData(sheetName: string, range: string = 'A:Z'): Promise<string[][]> {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${range}`,
            });

            return response.data.values || [];

        } catch (error) {
            console.error(`Failed to fetch sheet data: ${sheetName}`, error);
            throw new Error(`시트 "${sheetName}" 데이터를 가져올 수 없습니다.`);
        }
    }

    /**
     * 모든 시트의 데이터 가져오기 (병렬 처리)
     */
    async getAllSheetsData(range: string = 'A:Z'): Promise<Map<string, string[][]>> {
        const sheetNames = await this.getSheetNames();

        const results = await Promise.allSettled(
            sheetNames.map(name =>
                this.getSheetData(name, range).then(data => ({ name, data }))
            )
        );

        const sheetDataMap = new Map<string, string[][]>();

        for (const result of results) {
            if (result.status === 'fulfilled') {
                sheetDataMap.set(result.value.name, result.value.data);
            } else {
                console.warn('Failed to fetch sheet:', result.reason);
            }
        }

        return sheetDataMap;
    }
}
