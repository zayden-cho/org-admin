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
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    // ========================================
    // 읽기 메서드 (모두 Retry 적용)
    // ========================================

    /**
     * 모든 시트 이름 가져오기 (Retry)
     */
    async getSheetNames(): Promise<string[]> {
        return await this.retryWithBackoff(async () => {
            try {
                const response = await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId,
                });

                return response.data.sheets?.map(
                    sheet => sheet.properties?.title || ''
                ).filter(Boolean) || [];

            } catch (error: any) {
                if (error.code === 429) {
                    console.warn('⚠️ Read rate limit hit (getSheetNames), retrying...');
                    throw error;
                }
                console.error('Failed to fetch sheet names:', error);
                throw new Error('시트 목록을 가져올 수 없습니다.');
            }
        });
    }

    /**
     * 특정 시트의 데이터 가져오기 (Retry)
     */
    async getSheetData(sheetName: string, range: string = 'A:Z'): Promise<string[][]> {
        return await this.retryWithBackoff(async () => {
            try {
                const response = await this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!${range}`,
                });

                return response.data.values || [];

            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Read rate limit hit (${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to fetch sheet data: ${sheetName}`, error);
                throw new Error(`시트 "${sheetName}" 데이터를 가져올 수 없습니다.`);
            }
        });
    }

    /**
     * 모든 시트의 데이터 가져오기 (순차 처리 + 딜레이)
     */
    async getAllSheetsData(range: string = 'A:Z'): Promise<Map<string, string[][]>> {
        const sheetNames = await this.getSheetNames();
        const sheetDataMap = new Map<string, string[][]>();

        console.log(`📊 총 ${sheetNames.length}개 시트 순차 조회 시작 (Rate Limit 안전)...`);

        // ✅ 순차 처리 + 딜레이 (병렬 처리 금지!)
        for (let i = 0; i < sheetNames.length; i++) {
            const name = sheetNames[i];

            try {
                const data = await this.getSheetData(name, range);
                sheetDataMap.set(name, data);

                console.log(`✅ [${i + 1}/${sheetNames.length}] ${name} 조회 완료`);

                // ✅ 마지막 시트가 아니면 0.3초 대기
                if (i < sheetNames.length - 1) {
                    await this.sleep(300);
                }
            } catch (error) {
                console.warn(`❌ Failed to fetch sheet: ${name}`, error);
            }
        }

        console.log(`✅ 전체 시트 조회 완료: ${sheetDataMap.size}개`);
        return sheetDataMap;
    }

    /**
     * 특정 범위의 데이터 가져오기 (Retry)
     */
    async getRangeData(range: string): Promise<string[][]> {
        return await this.retryWithBackoff(async () => {
            try {
                const response = await this.sheets.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range,
                });

                return response.data.values || [];

            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Read rate limit hit (${range}), retrying...`);
                    throw error;
                }
                console.error(`Failed to fetch range data: ${range}`, error);
                throw new Error(`범위 "${range}" 데이터를 가져올 수 없습니다.`);
            }
        });
    }

    // ========================================
    // 쓰기 메서드 (모두 Retry 적용)
    // ========================================

    /**
     * 시트 생성 (Retry)
     */
    async createSheet(sheetName: string): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                addSheet: {
                                    properties: {
                                        title: sheetName,
                                    },
                                },
                            },
                        ],
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (createSheet: ${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to create sheet: ${sheetName}`, error);
                throw new Error(`시트 생성 실패: ${sheetName}`);
            }
        });
    }

    /**
     * 시트 데이터 업데이트 (Retry)
     */
    async updateSheetData(sheetName: string, range: string, values: any[][]): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const fullRange = `${sheetName}!${range}`;

                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: fullRange,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values,
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (updateSheetData: ${sheetName}!${range}), retrying...`);
                    throw error;
                }
                console.error(`Failed to update sheet data: ${sheetName}!${range}`, error);
                throw new Error(`시트 업데이트 실패: ${sheetName}`);
            }
        });
    }

    /**
     * 시트 데이터 추가 (Retry)
     */
    async appendSheetData(sheetName: string, values: any[][]): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                await this.sheets.spreadsheets.values.append({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values,
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (appendSheetData: ${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to append sheet data: ${sheetName}`, error);
                throw new Error(`시트 데이터 추가 실패: ${sheetName}`);
            }
        });
    }

    /**
     * 특정 범위 데이터 삭제 (Retry)
     */
    async clearRange(sheetName: string, range: string): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const fullRange = `${sheetName}!${range}`;

                await this.sheets.spreadsheets.values.clear({
                    spreadsheetId: this.spreadsheetId,
                    range: fullRange,
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (clearRange: ${sheetName}!${range}), retrying...`);
                    throw error;
                }
                console.error(`Failed to clear range: ${sheetName}!${range}`, error);
                throw new Error(`범위 삭제 실패: ${sheetName}!${range}`);
            }
        });
    }

    /**
     * 시트 전체 데이터 교체 (Retry)
     */
    async replaceSheetData(sheetName: string, values: any[][]): Promise<void> {
        try {
            await this.clearRange(sheetName, sheetName);

            if (values.length > 0) {
                await this.updateSheetData(sheetName, 'A1', values);
            }
        } catch (error) {
            console.error(`Failed to replace sheet data: ${sheetName}`, error);
            throw new Error(`시트 데이터 교체 실패: ${sheetName}`);
        }
    }

    /**
     * 시트 삭제 (Retry)
     */
    async deleteSheet(sheetName: string): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const response = await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId,
                });

                const sheet = response.data.sheets?.find(
                    s => s.properties?.title === sheetName
                );

                if (!sheet || !sheet.properties?.sheetId) {
                    throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);
                }

                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                deleteSheet: {
                                    sheetId: sheet.properties.sheetId,
                                },
                            },
                        ],
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (deleteSheet: ${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to delete sheet: ${sheetName}`, error);
                throw new Error(`시트 삭제 실패: ${sheetName}`);
            }
        });
    }

    /**
     * 배치 업데이트 (Retry)
     */
    async batchUpdate(updates: Array<{ range: string; values: any[][] }>): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const data = updates.map(update => ({
                    range: update.range,
                    values: update.values,
                }));

                await this.sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        valueInputOption: 'RAW',
                        data,
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn('⚠️ Write rate limit hit (batchUpdate), retrying...');
                    throw error;
                }
                console.error('Failed to batch update', error);
                throw new Error('배치 업데이트 실패');
            }
        });
    }

    /**
     * 헤더 행 굵게 포맷 (Retry)
     */
    async formatHeaderRow(sheetName: string): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const response = await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId,
                });

                const sheet = response.data.sheets?.find(
                    s => s.properties?.title === sheetName
                );

                if (!sheet || !sheet.properties?.sheetId) {
                    throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);
                }

                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                repeatCell: {
                                    range: {
                                        sheetId: sheet.properties.sheetId,
                                        startRowIndex: 0,
                                        endRowIndex: 1,
                                    },
                                    cell: {
                                        userEnteredFormat: {
                                            textFormat: {
                                                bold: true,
                                            },
                                        },
                                    },
                                    fields: 'userEnteredFormat.textFormat.bold',
                                },
                            },
                        ],
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (formatHeaderRow: ${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to format header row: ${sheetName}`, error);
                throw new Error(`헤더 포맷 실패: ${sheetName}`);
            }
        });
    }

    /**
     * 헤더 행 고정 (Retry)
     */
    async freezeHeaderRow(sheetName: string): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const response = await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId,
                });

                const sheet = response.data.sheets?.find(
                    s => s.properties?.title === sheetName
                );

                if (!sheet || !sheet.properties?.sheetId) {
                    throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);
                }

                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                updateSheetProperties: {
                                    properties: {
                                        sheetId: sheet.properties.sheetId,
                                        gridProperties: {
                                            frozenRowCount: 1,
                                        },
                                    },
                                    fields: 'gridProperties.frozenRowCount',
                                },
                            },
                        ],
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (freezeHeaderRow: ${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to freeze header row: ${sheetName}`, error);
                throw new Error(`헤더 고정 실패: ${sheetName}`);
            }
        });
    }

    /**
     * 컬럼 너비 자동 조정 (Retry)
     */
    async autoResizeColumns(sheetName: string, startColumn: number, endColumn: number): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const response = await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId,
                });

                const sheet = response.data.sheets?.find(
                    s => s.properties?.title === sheetName
                );

                if (!sheet || !sheet.properties?.sheetId) {
                    throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);
                }

                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                autoResizeDimensions: {
                                    dimensions: {
                                        sheetId: sheet.properties.sheetId,
                                        dimension: 'COLUMNS',
                                        startIndex: startColumn,
                                        endIndex: endColumn + 1,
                                    },
                                },
                            },
                        ],
                    },
                });
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (autoResizeColumns: ${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to auto resize columns: ${sheetName}`, error);
                // 에러 무시 (자동 크기 조정은 필수가 아님)
            }
        });
    }

    // ========================================
    // 유틸리티 메서드
    // ========================================

    /**
     * 시트 존재 여부 확인
     */
    async sheetExists(sheetName: string): Promise<boolean> {
        try {
            const sheetNames = await this.getSheetNames();
            return sheetNames.includes(sheetName);
        } catch (error) {
            console.error(`Failed to check sheet exists: ${sheetName}`, error);
            return false;
        }
    }

    /**
     * 컬럼 인덱스를 문자로 변환 (0 → A, 1 → B, ...)
     */
    protected columnToLetter(column: number): string {
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
     * Sleep 유틸리티
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * ✅ Exponential Backoff Retry (강화!)
     * - 429 에러 발생 시 지수적으로 대기 시간 증가
     * - 최대 5회 재시도
     * - 기본 2초부터 시작: 2초 → 4초 → 8초 → 16초 → 32초
     */
    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries: number = 5,
        baseDelay: number = 2000
    ): Promise<T> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                // 429 에러가 아니거나 마지막 시도면 throw
                if (error.code !== 429 || attempt === maxRetries - 1) {
                    throw error;
                }

                // Exponential backoff: 2초 → 4초 → 8초 → 16초 → 32초
                const delay = baseDelay * Math.pow(2, attempt);
                console.warn(`⚠️ Rate limit hit, retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                await this.sleep(delay);
            }
        }
        throw new Error('Max retries exceeded');
    }

    /**
     * 여러 범위를 한 번에 업데이트 (Batch Update with Retry)
     */
    async batchUpdateSheetData(
        sheetName: string,
        updates: Array<{ range: string; values: any[][] }>
    ): Promise<void> {
        await this.retryWithBackoff(async () => {
            try {
                const data = updates.map(update => ({
                    range: `${sheetName}!${update.range}`,
                    values: update.values
                }));

                await this.sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        valueInputOption: 'RAW',
                        data: data
                    }
                });

                console.log(`Batch update completed: ${updates.length} ranges in ${sheetName}`);
            } catch (error: any) {
                if (error.code === 429) {
                    console.warn(`⚠️ Write rate limit hit (batchUpdateSheetData: ${sheetName}), retrying...`);
                    throw error;
                }
                console.error(`Failed to batch update: ${sheetName}`, error);
                throw error;
            }
        });
    }

    /**
     * 대량 업데이트를 청크로 나눠서 처리
     */
    async batchUpdateWithChunks(
        sheetName: string,
        updates: Array<{ range: string; values: any[][] }>,
        chunkSize: number = 100
    ): Promise<void> {
        const chunks: Array<Array<{ range: string; values: any[][] }>> = [];

        for (let i = 0; i < updates.length; i += chunkSize) {
            chunks.push(updates.slice(i, i + chunkSize));
        }

        console.log(`📦 Processing ${updates.length} updates in ${chunks.length} chunks...`);

        for (let i = 0; i < chunks.length; i++) {
            console.log(`📦 Processing chunk ${i + 1}/${chunks.length}...`);

            await this.batchUpdateSheetData(sheetName, chunks[i]);

            if (i < chunks.length - 1) {
                await this.sleep(500);
            }
        }

        console.log(`✅ All chunks processed: ${updates.length} updates`);
    }

    /**
     * ✅ 신규 시트 생성 + 초기화 (배치 최적화 + Retry 강화)
     */
    async createAndInitializeSheet(
        sheetName: string,
        headers: string[],
        dataRows: any[][]
    ): Promise<void> {
        try {
            console.log(`🔧 시트 생성 및 초기화: ${sheetName}`);

            // 1. 시트 생성 (Retry 적용됨)
            await this.createSheet(sheetName);
            await this.sleep(500);

            // 2. 시트 정보 가져오기 (Retry 적용)
            const response = await this.retryWithBackoff(async () => {
                return await this.sheets.spreadsheets.get({
                    spreadsheetId: this.spreadsheetId,
                });
            });

            const sheet = response.data.sheets?.find(
                s => s.properties?.title === sheetName
            );

            if (!sheet || !sheet.properties?.sheetId) {
                throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);
            }

            const sheetId = sheet.properties.sheetId;

            // 3. 포맷 + 고정 + 자동크기를 하나의 batchUpdate로! (Retry 적용)
            await this.retryWithBackoff(async () => {
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [
                            // 헤더 굵게
                            {
                                repeatCell: {
                                    range: {
                                        sheetId,
                                        startRowIndex: 0,
                                        endRowIndex: 1,
                                    },
                                    cell: {
                                        userEnteredFormat: {
                                            textFormat: {
                                                bold: true,
                                            },
                                        },
                                    },
                                    fields: 'userEnteredFormat.textFormat.bold',
                                },
                            },
                            // 헤더 고정
                            {
                                updateSheetProperties: {
                                    properties: {
                                        sheetId,
                                        gridProperties: {
                                            frozenRowCount: 1,
                                        },
                                    },
                                    fields: 'gridProperties.frozenRowCount',
                                },
                            },
                            // 컬럼 자동 크기
                            {
                                autoResizeDimensions: {
                                    dimensions: {
                                        sheetId,
                                        dimension: 'COLUMNS',
                                        startIndex: 0,
                                        endIndex: headers.length,
                                    },
                                },
                            },
                        ],
                    },
                });
            });

            await this.sleep(500);

            // 4. 헤더 + 데이터를 한 번에! (Retry 적용됨)
            const allData = [headers, ...dataRows];
            await this.updateSheetData(sheetName, 'A1', allData);

            console.log(`✅ 시트 생성 및 초기화 완료: ${sheetName}, ${dataRows.length}행`);

        } catch (error: any) {
            console.error(`시트 생성 및 초기화 실패: ${sheetName}`, error);
            throw new Error(`시트 생성 실패: ${sheetName}`);
        }
    }
}
