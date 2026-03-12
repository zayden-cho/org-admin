import { SheetData, SheetRow, cellToString, isValidSheetData, isValidSheetRow, getErrorMessage } from '@/core/types/sheets.types';
import { SyncRepository } from '@/features/sync/sync.repository';
import { KonacardData, SourceRow, SheetItem } from '@/features/sync/sync.types';

export class SyncService {
    private repository: SyncRepository;

    constructor() {
        this.repository = new SyncRepository();
    }

    async syncAllKrews(): Promise<{ success: boolean; message: string; count?: number }> {
        try {
            const result = await this.processKrews(null);

            return {
                success: true,
                message: '전체 갱신이 완료되었습니다.',
                count: result.totalKrews
            };
        } catch (error) {
            console.error('전체 갱신 오류:', error);
            return {
                success: false,
                message: `오류: ${getErrorMessage(error)}`,
            };
        }
    }

    async syncCorpKrews(corp: string): Promise<{ success: boolean; message: string; count?: number }> {
        try {
            if (!corp) {
                throw new Error('법인을 선택해주세요.');
            }

            const result = await this.processKrews(corp.trim());

            return {
                success: true,
                message: `"${corp}" 갱신이 완료되었습니다.`,
                count: result.totalKrews
            };
        } catch (error) {
            console.error('법인 갱신 오류:', error);
            return {
                success: false,
                message: `오류: ${getErrorMessage(error)}`,
            };
        }
    }

    async syncCorpKonacards(corp: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!corp) {
                throw new Error('법인을 선택해주세요.');
            }

            await this.processKonacards(corp.trim());
            return {
                success: true,
                message: `"${corp}" 코나카드 갱신이 완료되었습니다.`,
            };
        } catch (error) {
            console.error('코나카드 갱신 오류:', error);
            return {
                success: false,
                message: `오류: ${getErrorMessage(error)}`,
            };
        }
    }

    private async processKrews(corpName: string | null = null): Promise<{ totalKrews: number }> {
        const SOURCE_SHEET_NAME = "조합원 명부(실시간)";
        const SOURCE_HEADERS = [
            "법인",
            "한글명",
            "영문명",
            "연락처",
            "체크오프 대상",
            "CMS 상태"
        ];

        const BASE_HEADERS = [
            "corpId",
            "krewId",
            "법인",
            "한글명",
            "영문명",
            "연락처",
            "체크오프 대상",
            "CMS 상태",
            "가입월",
            "코나카드",
            "코나카드 앱등록여부",
            "직책",
            "조직도"
        ];

        const MAX_SHEET_NAME_LEN = 100;

        // ========================================
        // 1. 원본 시트 데이터 가져오기
        // ========================================
        const values = await this.repository.getSourceSheetData(SOURCE_SHEET_NAME);

        if (values.length < 2) {
            throw new Error("원본 시트에 데이터 행이 없습니다.");
        }

        // ========================================
        // 2. 헤더 컬럼 인덱스 매핑
        // ========================================
        const headerRow = values[0].map(value => String(value).trim());

        const columnId: Record<string, number> = {};
        for (const header of SOURCE_HEADERS) {
            const index = headerRow.indexOf(header);
            if (index === -1) {
                throw new Error(`원본 헤더에서 "${header}" 컬럼을 찾을 수 없습니다.`);
            }
            columnId[header] = index;
        }

        // ========================================
        // 3. 법인별 데이터 그룹화
        // ========================================
        const items = new Map<string, SheetItem>();

        for (let i = 1; i < values.length; i++) {
            const row = values[i];

            const sourceId = row[0];
            const corp = row[columnId["법인"]];
            const name = row[columnId["한글명"]];
            const ldap = row[columnId["영문명"]];
            const phoneNumber = row[columnId["연락처"]];
            const checkoffStatus = row[columnId["체크오프 대상"]];
            const cmsStatus = row[columnId["CMS 상태"]];

            // 빈 행 스킵
            if ([corp, name, ldap, phoneNumber, checkoffStatus, cmsStatus].every(
                value => value === "" || value === null || value === undefined
            )) {
                continue;
            }

            const corpString = String(corp ?? "").trim() || "미지정";

            // 특정 법인만 처리하는 경우 필터링
            if (corpName !== null && corpString !== corpName) {
                continue;
            }

            const sheetName = this.formatSheetName(corpString, MAX_SHEET_NAME_LEN);

            if (!items.has(sheetName)) {
                items.set(sheetName, { corpString, rows: [] });
            }

            items.get(sheetName)!.rows.push({
                sourceId,
                corp,
                name,
                ldap,
                phoneNumber,
                checkoffStatus,
                cmsStatus,
            });
        }

        // ========================================
        // 4. 데이터 검증
        // ========================================
        if (corpName !== null && items.size === 0) {
            throw new Error(`"${corpName}" 법인의 데이터를 찾을 수 없습니다.`);
        }

        // ========================================
        // 5. 각 법인 시트 처리 (Rate Limit 회피)
        // ========================================
        let sheetCount = 0;
        let totalKrews = 0;
        const totalSheets = items.size;

        for (const [sheetName, item] of items.entries()) {
            sheetCount++;
            totalKrews += item.rows.length;

            // 시트 데이터 머지 (신규 생성 또는 기존 업데이트)
            await this.mergeSheetData(sheetName, item.rows, BASE_HEADERS);

            // ✅ Rate Limit 회피: 마지막 시트가 아니면 1초 대기
            if (sheetCount < totalSheets) {
                console.log(`⏳ Rate limit 회피: 1초 대기... (${sheetCount}/${totalSheets})`);
                await this.sleep(1000);
            }
        }

        // ========================================
        // 6. 완료 로그
        // ========================================
        const mode = corpName ? `"${corpName}" 법인` : "전체";
        console.log(`✅ ${mode} 처리 완료: ${items.size}개 시트, ${totalKrews}명`);

        // ✅ 조합원 수 반환
        return { totalKrews };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async mergeSheetData(
        sheetName: string,
        sourceDataArray: SourceRow[],
        baseHeaders: string[]
    ): Promise<void> {
        const exists = await this.repository.targetSheetExists(sheetName);

        if (!exists) {
            console.log(`🆕 신규 시트 생성: ${sheetName}`);

            const dataRows: SheetData = [];
            for (let i = 0; i < sourceDataArray.length; i++) {
                const data = sourceDataArray[i];
                const corpId = `kuc-${i + 1}`;
                const krewId = `ku-${cellToString(data.sourceId)}`;

                dataRows.push([
                    corpId,
                    krewId,
                    cellToString(data.corp),
                    cellToString(data.name),
                    cellToString(data.ldap),
                    cellToString(data.phoneNumber),
                    cellToString(data.checkoffStatus),
                    cellToString(data.cmsStatus),
                    '',
                    '',
                    '',
                    '',
                    ''
                ]);
            }

            await this.repository.createAndInitializeTargetSheet(
                sheetName,
                baseHeaders,
                dataRows
            );

            console.log(`✅ 신규 시트 생성 완료: ${sheetName}, ${dataRows.length}명`);
            return;
        }

        const existingData = await this.repository.getTargetSheetData(sheetName);

        // 빈 시트 처리
        if (existingData.length < 1) {
            console.log(`📝 빈 시트 초기화: ${sheetName}`);

            const dataRows: SheetData = [];
            for (let i = 0; i < sourceDataArray.length; i++) {
                const data = sourceDataArray[i];
                const corpId = `kuc-${i + 1}`;
                const krewId = `ku-${data.sourceId}`;

                dataRows.push([
                    corpId,
                    krewId,
                    cellToString(data.corp),
                    cellToString(data.name),
                    cellToString(data.ldap),
                    cellToString(data.phoneNumber),
                    cellToString(data.checkoffStatus),
                    cellToString(data.cmsStatus),
                    '',
                    '',
                    '',
                    '',
                    ''
                ]);
            }

            await this.repository.createAndInitializeTargetSheet(
                sheetName,
                baseHeaders,
                dataRows
            );

            console.log(`✅ 빈 시트 초기화 완료: ${sheetName}, ${dataRows.length}명`);
            return;
        }

        // ========================================
        // 기존 데이터 머지
        // ========================================
        console.log(`🔄 기존 시트 업데이트: ${sheetName}`);

        const headers = existingData[0].map(h => String(h).trim());

        const colIndex: Record<string, number> = {};
        headers.forEach((header, index) => {
            colIndex[header] = index;
        });

        if (colIndex['영문명'] === undefined) {
            throw new Error(`"${sheetName}" 시트에서 "영문명" 컬럼을 찾을 수 없습니다.`);
        }

        const existingMap = new Map<string, SheetRow>();
        for (let i = 1; i < existingData.length; i++) {
            const ldap = cellToString(existingData[i][colIndex['영문명']]).trim();
            if (ldap) {
                existingMap.set(ldap, existingData[i]);
            }
        }

        const finalData: SheetData = [];

        for (let i = 0; i < sourceDataArray.length; i++) {
            const data = sourceDataArray[i];
            const ldap = cellToString(data.ldap).trim();

            const corpId = `kuc-${i + 1}`;
            const krewId = `ku-${cellToString(data.sourceId)}`;

            let rowData: SheetRow;

            const oldRow = existingMap.get(ldap);
            if (ldap && oldRow && isValidSheetRow(oldRow)) {
                rowData = [...oldRow];

                if (colIndex['corpId'] !== undefined) {
                    rowData[colIndex['corpId']] = corpId;
                }
                if (colIndex['krewId'] !== undefined) {
                    rowData[colIndex['krewId']] = krewId;
                }
                if (colIndex['법인'] !== undefined) {
                    rowData[colIndex['법인']] = cellToString(data.corp);
                }
                if (colIndex['한글명'] !== undefined) {
                    rowData[colIndex['한글명']] = cellToString(data.name);
                }
                if (colIndex['영문명'] !== undefined) {
                    rowData[colIndex['영문명']] = cellToString(data.ldap);
                }
                if (colIndex['연락처'] !== undefined) {
                    rowData[colIndex['연락처']] = cellToString(data.phoneNumber);
                }
                if (colIndex['체크오프 대상'] !== undefined) {
                    rowData[colIndex['체크오프 대상']] = cellToString(data.checkoffStatus);
                }
                if (colIndex['CMS 상태'] !== undefined) {
                    rowData[colIndex['CMS 상태']] = cellToString(data.cmsStatus);
                }
            } else {
                rowData = new Array(baseHeaders.length).fill('');

                if (colIndex['corpId'] !== undefined) {
                    rowData[colIndex['corpId']] = corpId;
                }
                if (colIndex['krewId'] !== undefined) {
                    rowData[colIndex['krewId']] = krewId;
                }
                if (colIndex['법인'] !== undefined) {
                    rowData[colIndex['법인']] = cellToString(data.corp);
                }
                if (colIndex['한글명'] !== undefined) {
                    rowData[colIndex['한글명']] = cellToString(data.name);
                }
                if (colIndex['영문명'] !== undefined) {
                    rowData[colIndex['영문명']] = cellToString(data.ldap);
                }
                if (colIndex['연락처'] !== undefined) {
                    rowData[colIndex['연락처']] = cellToString(data.phoneNumber);
                }
                if (colIndex['체크오프 대상'] !== undefined) {
                    rowData[colIndex['체크오프 대상']] = cellToString(data.checkoffStatus);
                }
                if (colIndex['CMS 상태'] !== undefined) {
                    rowData[colIndex['CMS 상태']] = cellToString(data.cmsStatus);
                }
            }

            finalData.push(rowData);
        }

        // ========================================
        // 데이터 교체
        // ========================================
        if (existingData.length > 1) {
            const lastCol = this.columnToLetter(Math.max(headers.length, baseHeaders.length));
            await this.repository.clearTargetRange(sheetName, `A2:${lastCol}${existingData.length}`);
        }

        if (finalData.length > 0) {
            await this.repository.updateTargetSheetData(sheetName, 'A2', finalData);
        }

        await this.repository.autoResizeTargetColumns(sheetName, 0, baseHeaders.length - 1);

        console.log(`✅ 기존 시트 업데이트 완료: ${sheetName}, ${finalData.length}명`);
    }

    private async processKonacards(corpName: string): Promise<void> {
        const KONACARD_SHEET_NAME = "목록";

        const values = await this.repository.getKonacardSheetData(KONACARD_SHEET_NAME);

        if (values.length < 2) {
            throw new Error("코나카드 시트에 데이터가 없습니다.");
        }

        const headers = values[0].map(h => String(h).trim());

        const cardNumCol = headers.indexOf('카드번호');
        const empNoCol = headers.indexOf('사원번호');
        const dupCol = headers.indexOf('중복');
        const deptCol = headers.indexOf('부서명');
        const appRegisteredCol = headers.indexOf('앱등록여부');

        if (cardNumCol === -1 || empNoCol === -1 || dupCol === -1 || deptCol === -1) {
            throw new Error('필수 컬럼을 찾을 수 없습니다: 카드번호, 사원번호, 중복, 부서명');
        }

        if (appRegisteredCol === -1) {
            console.warn('"앱등록여부" 컬럼을 찾을 수 없습니다. 기본값("")으로 처리됩니다.');
        }

        const konacardMap = new Map<string, Map<string, KonacardData>>();

        for (let i = 1; i < values.length; i++) {
            const row = values[i];

            const isDuplicate = String(row[dupCol] || '').toUpperCase();
            if (isDuplicate === 'TRUE') {
                continue;
            }

            const cardNumber = String(row[cardNumCol] ?? "").trim();
            const empNo = String(row[empNoCol] ?? "").trim();
            const corpNameRaw = String(row[deptCol] ?? "").trim();

            const appRegistered = appRegisteredCol !== -1
                ? String(row[appRegisteredCol] ?? "").trim()
                : "";

            if (!cardNumber || !empNo || !corpNameRaw) {
                continue;
            }

            if (corpNameRaw !== corpName) {
                continue;
            }

            if (!konacardMap.has(corpNameRaw)) {
                konacardMap.set(corpNameRaw, new Map());
            }

            konacardMap.get(corpNameRaw)!.set(empNo, {
                cardNumber,
                appRegistered
            });
        }

        if (konacardMap.size === 0) {
            throw new Error(`"${corpName}" 법인의 코나카드 데이터를 찾을 수 없습니다.`);
        }

        console.log(`"${corpName}" 법인 코나카드 데이터: ${konacardMap.size}개 법인`);

        let totalUpdated = 0;

        for (const [corpNameKey, empMap] of konacardMap.entries()) {
            const sheetName = this.formatSheetName(corpNameKey, 100);

            // ✅ this.repository.targetSheetExists 사용
            const exists = await this.repository.targetSheetExists(sheetName);

            if (!exists) {
                console.log(`❌ 시트를 찾을 수 없음: ${sheetName}`);
                continue;
            }

            const updated = await this.updateKonacardInSheet(sheetName, empMap);
            totalUpdated += updated;
            console.log(`✅ ${sheetName}: ${updated}개 업데이트`);
        }

        console.log(`✅ "${corpName}" ${totalUpdated}개 코나카드 업데이트 완료`);
    }

    private async updateKonacardInSheet(
        sheetName: string,
        empMap: Map<string, KonacardData>
    ): Promise<number> {

        const data = await this.repository.getTargetSheetData(sheetName);

        if (!isValidSheetData(data)) {
            console.error('Invalid sheet data format');
            throw new Error('시트 데이터 형식이 올바르지 않습니다');
        }

        if (data.length < 2) {
            return 0;
        }

        const headers = data[0].map(h => String(h).trim());

        const empNoCol = headers.indexOf('영문명');
        let konacardCol = headers.indexOf('코나카드');
        let appRegisteredCol = headers.indexOf('코나카드 앱등록여부');

        if (empNoCol === -1) {
            return 0;
        }

        // ✅ 코나카드 컬럼 없으면 추가
        if (konacardCol === -1) {
            konacardCol = headers.length;

            await this.repository.updateTargetSheetData(
                sheetName,
                `${this.columnToLetter(konacardCol + 1)}1`,
                [['코나카드']]
            );

            await this.repository.formatTargetHeaderRow(sheetName);

            console.log(`📝 "${sheetName}" 시트에 "코나카드" 컬럼 추가`);
        }

        if (appRegisteredCol === -1) {
            appRegisteredCol = konacardCol === headers.length ? konacardCol + 1 : headers.length;

            await this.repository.updateTargetSheetData(
                sheetName,
                `${this.columnToLetter(appRegisteredCol + 1)}1`,
                [['코나카드 앱등록여부']]
            );

            await this.repository.formatTargetHeaderRow(sheetName);

            console.log(`📝 "${sheetName}" 시트에 "코나카드 앱등록여부" 컬럼 추가`);
        }

        const updates: Array<{
            row: number;
            cardNumber: string;
            appRegistered: string
        }> = [];

        for (let i = 1; i < data.length; i++) {
            const empNo = String(data[i][empNoCol] ?? "").trim();

            if (empMap.has(empNo)) {
                const konacardData = empMap.get(empNo)!;
                updates.push({
                    row: i + 1,
                    cardNumber: konacardData.cardNumber,
                    appRegistered: konacardData.appRegistered,
                });
            }
        }

        if (updates.length > 0) {
            const batchUpdates: Array<{ range: string; values: SheetData }> = [];

            for (const update of updates) {
                // 코나카드 번호
                batchUpdates.push({
                    range: `${this.columnToLetter(konacardCol + 1)}${update.row}`,
                    values: [[update.cardNumber]]
                });

                // 앱등록여부
                batchUpdates.push({
                    range: `${this.columnToLetter(appRegisteredCol + 1)}${update.row}`,
                    values: [[update.appRegistered]]
                });
            }

            if (batchUpdates.length > 200) {
                await this.repository.batchUpdateTargetWithChunks(sheetName, batchUpdates, 100);
            } else {
                await this.repository.batchUpdateTargetSheet(sheetName, batchUpdates);
            }

            console.log(`✅ ${sheetName}: ${updates.length}개 코나카드 업데이트 완료 (Batch)`);
        }

        await this.repository.autoResizeTargetColumns(sheetName, konacardCol, appRegisteredCol);

        return updates.length;
    }

    private formatSheetName(name: string, maxLen: number): string {
        let sheetName = String(name).trim();
        sheetName = sheetName.replace(/[:\\/?*[\]]/g, " ");
        sheetName = sheetName.replace(/\s+/g, " ").trim();

        if (!sheetName) {
            sheetName = "미지정";
        }

        if (sheetName.length > maxLen) {
            sheetName = sheetName.slice(0, maxLen).trim();
        }

        return sheetName;
    }

    private columnToLetter(column: number): string {
        let temp: number;
        let letter = '';
        while (column > 0) {
            temp = (column - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            column = (column - temp - 1) / 26;
        }
        return letter;
    }
}

export const syncService = new SyncService();
