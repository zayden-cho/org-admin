import { SheetData, cellToString, isValidSheetData, getErrorMessage } from '@/core/types/sheets.types';
import { columnToLetter, sleep, formatSheetName } from '@/core/utils/sheet.utils';
import { krewsService } from '@/features/krews/krews.service';
import { SyncRepository } from '@/features/sync/sync.repository';
import { KonacardItem, NotFoundKonacardItem, SourceRow } from '@/features/sync/sync.types';

export class SyncService {
    private repository: SyncRepository;

    constructor() {
        this.repository = new SyncRepository();
    }

    /**
     * 전체 조합원 갱신
     */
    async syncAllKrews(): Promise<{ success: boolean; message: string; count?: number }> {
        try {
            const result = await this.processKrews();

            return {
                success: true,
                message: '전체 조합원 갱신이 완료되었습니다.',
                count: result.totalKrews
            };
        } catch (error) {
            console.error('전체 조합원 갱신 오류:', error);
            return {
                success: false,
                message: `오류: ${getErrorMessage(error)}`,
            };
        }
    }

    /**
     * 전체 코나카드 갱신
     */
    async syncAllKonacards(): Promise<{
        success: boolean;
        message: string;
        count?: number;
        notFoundCount?: number;
        notFoundItems?: NotFoundKonacardItem[];
    }> {
        try {
            const result = await this.processKonacards();

            let message = `전체 코나카드 갱신이 완료되었습니다. (${result.totalUpdated}건 업데이트)`;

            if (result.notFoundInTarget.length > 0) {
                message += `\n조합원명부에 없는 코나카드 ${result.notFoundInTarget.length}건 발견`;
            }

            return {
                success: true,
                message,
                count: result.totalUpdated,
                notFoundCount: result.notFoundInTarget.length,
                notFoundItems: result.notFoundInTarget
            };
        } catch (error) {
            console.error('전체 코나카드 갱신 오류:', error);
            return {
                success: false,
                message: `오류: ${getErrorMessage(error)}`,
            };
        }
    }

    /**
     * 조합원 처리
     */
    private async processKrews(): Promise<{ totalKrews: number }> {
        const SOURCE_SHEET_NAME = "조합원 명부(실시간)";
        const SOURCE_HEADERS = [
            "법인",
            "한글명",
            "영문명",
            "연락처",
            "체크오프 대상",
            "CMS 상태"
        ];

        const KREWUNION_HEADERS = [
            "krewunionId",
            "법인",
            "한글명",
            "영문명",
            "연락처",
            "체크오프 대상",
            "상태",
            "가입월"
        ];

        const CORP_HEADERS = [
            "corpId",
            "krewunionId",
            "법인",
            "한글명",
            "영문명",
            "연락처",
            "체크오프 대상",
            "상태",
            "가입월",
            "조합원방 참여여부",
            "코나카드",
            "코나카드 앱등록여부",
            "직책",
            "조직도"
        ];

        const UNION_SHEET_NAME = "크루유니언";
        const MAX_SHEET_NAME_LEN = 100;

        console.log('원본 시트에서 데이터 가져오는 중...');
        const values = await this.repository.getSourceSheetData(SOURCE_SHEET_NAME);

        if (values.length < 2) {
            throw new Error("원본 시트에 데이터 행이 없습니다.");
        }

        const headerRow = values[0].map(value => String(value).trim());

        const columnId: Record<string, number> = {};
        for (const header of SOURCE_HEADERS) {
            const index = headerRow.indexOf(header);
            if (index === -1) {
                throw new Error(`원본 헤더에서 "${header}" 컬럼을 찾을 수 없습니다.`);
            }
            columnId[header] = index;
        }

        const sourceRows: SourceRow[] = [];

        for (let i = 1; i < values.length; i++) {
            const row = values[i];

            const sourceId = row[0];
            const corp = row[columnId["법인"]];
            const name = row[columnId["한글명"]];
            const ldap = row[columnId["영문명"]];
            const phoneNumber = row[columnId["연락처"]];
            const checkoffStatus = row[columnId["체크오프 대상"]];
            const cmsStatus = row[columnId["CMS 상태"]];

            if ([corp, name, ldap, phoneNumber, checkoffStatus, cmsStatus].every(
                value => value === "" || value === null || value === undefined
            )) {
                continue;
            }

            const corpString = cellToString(corp).trim() || "미지정";

            sourceRows.push({
                sourceId,
                corp: corpString,
                name: cellToString(name).trim(),
                ldap: cellToString(ldap).trim(),
                phoneNumber: cellToString(phoneNumber).trim(),
                checkoffStatus: cellToString(checkoffStatus).trim(),
                cmsStatus: cellToString(cmsStatus).trim()
            });
        }

        console.log(`원본 데이터 파싱 완료: ${sourceRows.length}명`);

        console.log('크루유니언 시트 갱신 중...');

        const unionExists = await this.repository.targetSheetExists(UNION_SHEET_NAME);

        const existingUnionMap = new Map<string, {
            krewunionId: string;
            rowIndex: number;
            corp: string;
            name: string;
            ldap: string;
            phoneNumber: string;
            checkoffStatus: string;
            cmsStatus: string;
            joinMonth: string;
        }>();

        let maxKrewunionId = 0;

        if (unionExists) {
            console.log('기존 크루유니언 시트 발견, 데이터 로드 중...');

            const existingData = await this.repository.getTargetSheetData(UNION_SHEET_NAME);

            if (existingData.length > 1) {
                for (let i = 1; i < existingData.length; i++) {
                    const row = existingData[i];
                    const krewunionId = cellToString(row[0]);
                    const corp = cellToString(row[1]);
                    const name = cellToString(row[2]);
                    const ldap = cellToString(row[3]);
                    const phoneNumber = cellToString(row[4]);
                    const checkoffStatus = cellToString(row[5]);
                    const cmsStatus = cellToString(row[6]);
                    const joinMonth = cellToString(row[7]);

                    if (krewunionId) {
                        const match = krewunionId.match(/\d+$/);
                        if (match) {
                            const num = parseInt(match[0]);
                            if (num > maxKrewunionId) {
                                maxKrewunionId = num;
                            }
                        }

                        const uniqueKey = this.getUniqueKey({
                            corp,
                            name,
                            ldap,
                            phoneNumber
                        });

                        existingUnionMap.set(uniqueKey, {
                            krewunionId,
                            rowIndex: i + 1,
                            corp,
                            name,
                            ldap,
                            phoneNumber,
                            checkoffStatus,
                            cmsStatus,
                            joinMonth
                        });
                    }
                }
            }
        }

        console.log(`기존 크루유니언 데이터: ${existingUnionMap.size}명, 최대 krewunionId: ${maxKrewunionId}`);

        const sourceUnionMap = new Map<string, SourceRow>();
        let duplicateCount = 0;

        for (const sourceRow of sourceRows) {
            const uniqueKey = this.getUniqueKey({
                corp: sourceRow.corp,
                name: sourceRow.name,
                ldap: sourceRow.ldap,
                phoneNumber: sourceRow.phoneNumber
            });

            if (sourceUnionMap.has(uniqueKey)) {
                console.warn('중복 발견:', uniqueKey, sourceRow);
                duplicateCount++;
            }

            sourceUnionMap.set(uniqueKey, sourceRow);
        }

        console.log(`중복 제거: ${duplicateCount}명`);

        const updateList: Array<{ rowIndex: number; cmsStatus: string }> = [];
        const deleteList: number[] = [];
        const insertList: Array<{ krewunionId: string; sourceRow: SourceRow }> = [];
        const krewunionIdMap = new Map<string, string>();

        for (const [uniqueKey, existing] of existingUnionMap.entries()) {
            if (sourceUnionMap.has(uniqueKey)) {
                const sourceRow = sourceUnionMap.get(uniqueKey)!;

                if (existing.cmsStatus !== sourceRow.cmsStatus) {
                    updateList.push({
                        rowIndex: existing.rowIndex,
                        cmsStatus: sourceRow.cmsStatus
                    });
                }

                krewunionIdMap.set(uniqueKey, existing.krewunionId);
            } else {
                deleteList.push(existing.rowIndex);
            }
        }

        for (const [uniqueKey, sourceRow] of sourceUnionMap.entries()) {
            if (!existingUnionMap.has(uniqueKey)) {
                maxKrewunionId++;
                const krewunionId = `KU-${String(maxKrewunionId).padStart(6, '0')}`;
                insertList.push({ krewunionId, sourceRow });
                krewunionIdMap.set(uniqueKey, krewunionId);
            }
        }

        console.log(`크루유니언 변경 사항: UPDATE ${updateList.length}명, DELETE ${deleteList.length}명, INSERT ${insertList.length}명`);

        if (!unionExists) {
            console.log('크루유니언 시트 신규 생성 중...');
            const initialData: SheetData = insertList.map(item => [
                item.krewunionId,
                cellToString(item.sourceRow.corp),
                cellToString(item.sourceRow.name),
                cellToString(item.sourceRow.ldap),
                cellToString(item.sourceRow.phoneNumber),
                cellToString(item.sourceRow.checkoffStatus),
                cellToString(item.sourceRow.cmsStatus),
                ''
            ]);
            await this.repository.createAndInitializeTargetSheet(UNION_SHEET_NAME, KREWUNION_HEADERS, initialData);
            console.log('크루유니언 시트 생성 완료');
        } else {
            if (updateList.length > 0) {
                console.log(`${updateList.length}명 상태 업데이트 중...`);
                const batchUpdates = updateList.map(item => ({
                    range: `G${item.rowIndex}`,
                    values: [[item.cmsStatus]]
                }));
                await this.repository.batchUpdateTargetSheet(UNION_SHEET_NAME, batchUpdates);
                console.log('상태 업데이트 완료');
            }

            if (deleteList.length > 0) {
                console.log(`${deleteList.length}명 삭제 중...`);
                await this.repository.deleteTargetRows(UNION_SHEET_NAME, deleteList);
            }

            if (insertList.length > 0) {
                console.log(`${insertList.length}명 신규 추가 중...`);
                const newRows: SheetData = insertList.map(item => [
                    item.krewunionId,
                    cellToString(item.sourceRow.corp),
                    cellToString(item.sourceRow.name),
                    cellToString(item.sourceRow.ldap),
                    cellToString(item.sourceRow.phoneNumber),
                    cellToString(item.sourceRow.checkoffStatus),
                    cellToString(item.sourceRow.cmsStatus),
                    ''
                ]);

                await this.repository.appendTargetSheetData(
                    UNION_SHEET_NAME,
                    newRows
                );
                console.log('신규 추가 완료');
            }
        }

        console.log('크루유니언 시트 갱신 완료');

        await sleep(1000);

        console.log('법인별 시트 갱신 시작...');

        const corpSourceMap = new Map<string, SourceRow[]>();
        for (const sourceRow of sourceRows) {
            const corp = cellToString(sourceRow.corp);
            const sheetName = formatSheetName(corp, MAX_SHEET_NAME_LEN);

            if (!corpSourceMap.has(sheetName)) {
                corpSourceMap.set(sheetName, []);
            }
            corpSourceMap.get(sheetName)!.push(sourceRow);
        }

        let sheetCount = 0;
        const totalSheets = corpSourceMap.size;

        for (const [sheetName, corpSourceRows] of corpSourceMap.entries()) {
            sheetCount++;
            console.log(`\n[${sheetCount}/${totalSheets}] ${sheetName} 처리 중...`);

            const sheetExists = await this.repository.targetSheetExists(sheetName);

            const existingCorpMap = new Map<string, {
                corpId: string;
                krewunionId: string;
                rowIndex: number;
                cmsStatus: string;
            }>();
            let maxCorpId = 0;

            if (sheetExists) {
                const existingData = await this.repository.getTargetSheetData(sheetName);

                if (existingData.length > 1) {
                    for (let i = 1; i < existingData.length; i++) {
                        const row = existingData[i];
                        const corpId = cellToString(row[0]);
                        const krewunionId = cellToString(row[1]);
                        const corp = cellToString(row[2]);
                        const name = cellToString(row[3]);
                        const ldap = cellToString(row[4]);
                        const phoneNumber = cellToString(row[5]);
                        const cmsStatus = cellToString(row[7]);

                        if (corpId) {
                            const match = corpId.match(/\d+$/);
                            if (match) {
                                const num = parseInt(match[0]);
                                if (num > maxCorpId) {
                                    maxCorpId = num;
                                }
                            }

                            const uniqueKey = this.getUniqueKey({ corp, name, ldap, phoneNumber });
                            existingCorpMap.set(uniqueKey, {
                                corpId,
                                krewunionId,
                                rowIndex: i + 1,
                                cmsStatus
                            });
                        }
                    }
                }
            }

            const sourceCorpMap = new Map<string, SourceRow>();
            for (const sourceRow of corpSourceRows) {
                const uniqueKey = this.getUniqueKey({
                    corp: sourceRow.corp,
                    name: sourceRow.name,
                    ldap: sourceRow.ldap,
                    phoneNumber: sourceRow.phoneNumber
                });
                sourceCorpMap.set(uniqueKey, sourceRow);
            }

            const corpUpdateList: Array<{ rowIndex: number; cmsStatus: string }> = [];
            const corpDeleteList: number[] = [];
            const corpInsertList: Array<{ corpId: string; krewunionId: string; sourceRow: SourceRow }> = [];

            for (const [uniqueKey, existing] of existingCorpMap.entries()) {
                if (sourceCorpMap.has(uniqueKey)) {
                    const sourceRow = sourceCorpMap.get(uniqueKey)!;
                    if (existing.cmsStatus !== sourceRow.cmsStatus) {
                        corpUpdateList.push({
                            rowIndex: existing.rowIndex,
                            cmsStatus: sourceRow.cmsStatus
                        });
                    }
                } else {
                    corpDeleteList.push(existing.rowIndex);
                }
            }

            for (const [uniqueKey, sourceRow] of sourceCorpMap.entries()) {
                if (!existingCorpMap.has(uniqueKey)) {
                    maxCorpId++;
                    const corpId = `KUC-${String(maxCorpId).padStart(6, '0')}`;
                    const krewunionId = krewunionIdMap.get(uniqueKey) || '';
                    corpInsertList.push({ corpId, krewunionId, sourceRow });
                }
            }

            console.log(`${sheetName}: UPDATE ${corpUpdateList.length}, DELETE ${corpDeleteList.length}, INSERT ${corpInsertList.length}`);

            if (!sheetExists) {
                console.log(`신규 시트 생성: ${sheetName}`);
                const initialData: SheetData = corpInsertList.map(item => [
                    item.corpId,
                    item.krewunionId,
                    cellToString(item.sourceRow.corp),
                    cellToString(item.sourceRow.name),
                    cellToString(item.sourceRow.ldap),
                    cellToString(item.sourceRow.phoneNumber),
                    cellToString(item.sourceRow.checkoffStatus),
                    cellToString(item.sourceRow.cmsStatus),
                    '',
                    '',
                    '',
                    '',
                    '',
                    ''
                ]);
                await this.repository.createAndInitializeTargetSheet(sheetName, CORP_HEADERS, initialData);
                console.log(`${sheetName} 생성 완료`);
            } else {
                if (corpUpdateList.length > 0) {
                    const batchUpdates = corpUpdateList.map(item => ({
                        range: `H${item.rowIndex}`,
                        values: [[item.cmsStatus]]
                    }));
                    await this.repository.batchUpdateTargetSheet(sheetName, batchUpdates);
                }

                if (corpDeleteList.length > 0) {
                    await this.repository.deleteTargetRows(sheetName, corpDeleteList);
                }

                if (corpInsertList.length > 0) {
                    const newRows: SheetData = corpInsertList.map(item => [
                        item.corpId,
                        item.krewunionId,
                        cellToString(item.sourceRow.corp),
                        cellToString(item.sourceRow.name),
                        cellToString(item.sourceRow.ldap),
                        cellToString(item.sourceRow.phoneNumber),
                        cellToString(item.sourceRow.checkoffStatus),
                        cellToString(item.sourceRow.cmsStatus),
                        '',
                        '',
                        '',
                        '',
                        '',
                        ''
                    ]);

                    await this.repository.appendTargetSheetData(
                        sheetName,
                        newRows
                    );
                }

                console.log(`${sheetName} 갱신 완료`);
            }

            if (sheetCount < totalSheets) {
                console.log(`Rate limit 회피: 1초 대기... (${sheetCount}/${totalSheets})`);
                await sleep(1000);
            }
        }

        console.log(`\n전체 처리 완료: ${corpSourceMap.size}개 시트, ${sourceRows.length}명`);

        console.log('크루 데이터 캐시 무효화 중...');
        krewsService.clearCache();
        console.log('크루 데이터 캐시 무효화 완료');

        return { totalKrews: sourceRows.length };
    }

    private getUniqueKey(data: { corp: string; name: string; ldap: string; phoneNumber: string }): string {
        if (data.corp && data.ldap) {
            const corp = data.corp.trim();
            const ldap = data.ldap.toLowerCase().trim();
            if (corp && ldap) {
                return `corp_ldap:${corp}:${ldap}`;
            }
        }

        if (data.corp && data.name && data.phoneNumber) {
            const corp = data.corp.trim();
            const name = data.name.trim();
            const phone = data.phoneNumber.replace(/[-\s]/g, '');

            if (corp && name && phone.length >= 10) {
                return `corp_name_phone:${corp}:${name}:${phone}`;
            }
        }

        console.warn('Fallback key used for:', data);
        return `fallback:${data.corp}:${data.name}:${data.ldap || 'no-ldap'}`;
    }

    /**
     * 코나카드 갱신 로직
     *
     * 키 구조: 법인(부서명) → 이름 + 사원번호
     * 매칭 실패 항목 추적
     */
    private async processKonacards(): Promise<{
        totalUpdated: number;
        notFoundInTarget: NotFoundKonacardItem[];
    }> {
        const KONACARD_SHEET_NAME = "목록";

        console.log('코나카드 시트에서 데이터 가져오는 중...');
        const values = await this.repository.getKonacardSheetData(KONACARD_SHEET_NAME);

        if (values.length < 2) {
            throw new Error("코나카드 시트에 데이터가 없습니다.");
        }

        const headers = values[0].map(h => String(h).trim());

        const cardNumCol = headers.indexOf('카드번호');
        const appRegisteredCol = headers.indexOf('앱등록여부');
        const nameCol = headers.indexOf('임직원명');
        const empNoCol = headers.indexOf('사원번호');
        const deptCol = headers.indexOf('부서명');
        const dupCol = headers.indexOf('중복');

        if (cardNumCol === -1 || empNoCol === -1 || dupCol === -1 || deptCol === -1) {
            throw new Error('필수 컬럼을 찾을 수 없습니다: 카드번호, 사원번호, 중복, 부서명');
        }

        if (nameCol === -1) {
            throw new Error('필수 컬럼을 찾을 수 없습니다: 성명');
        }

        if (appRegisteredCol === -1) {
            console.warn('"앱등록여부" 컬럼을 찾을 수 없습니다. 기본값("")으로 처리됩니다.');
        }

        const konacardMap = new Map<string, Map<string, KonacardItem>>();

        for (let i = 1; i < values.length; i++) {
            const row = values[i];

            const isDuplicate = String(row[dupCol] || '').toUpperCase();
            if (isDuplicate === 'TRUE') {
                continue;
            }

            const cardNumber = String(row[cardNumCol] ?? "").trim();
            const empNo = String(row[empNoCol] ?? "").trim();
            const name = String(row[nameCol] ?? "").trim();
            const corpNameRaw = String(row[deptCol] ?? "").trim();

            const appRegistered = appRegisteredCol !== -1
                ? String(row[appRegisteredCol] ?? "").trim()
                : "";

            if (!cardNumber || !empNo || !corpNameRaw || !name) {
                continue;
            }

            if (!konacardMap.has(corpNameRaw)) {
                konacardMap.set(corpNameRaw, new Map());
            }

            const uniqueKey = `${name}:${empNo}`;

            konacardMap.get(corpNameRaw)!.set(uniqueKey, {
                name,
                empNo,
                cardNumber,
                appRegistered
            });
        }

        console.log(`코나카드 데이터 파싱 완료: ${konacardMap.size}개 법인`);

        let totalUpdated = 0;
        const notFoundInTarget: NotFoundKonacardItem[] = [];

        for (const [corpName, empMap] of konacardMap.entries()) {
            const sheetName = formatSheetName(corpName, 100);

            const exists = await this.repository.targetSheetExists(sheetName);

            if (!exists) {
                console.log(`시트를 찾을 수 없음: ${sheetName} (건너뜀)`);

                for (const [_, data] of empMap.entries()) {
                    notFoundInTarget.push({
                        corp: corpName,
                        name: data.name,
                        empNo: data.empNo,
                        cardNumber: data.cardNumber
                    });
                }

                continue;
            }

            const result = await this.updateKonacardInSheet(sheetName, empMap, corpName);
            totalUpdated += result.updated;
            notFoundInTarget.push(...result.notFound);

            console.log(`${sheetName}: ${result.updated}개 업데이트, ${result.notFound.length}개 미매칭`);

            // Rate limit 방지
            await sleep(500);
        }

        console.log(`\n전체 코나카드 갱신 완료: ${totalUpdated}개 업데이트`);

        if (notFoundInTarget.length > 0) {
            console.warn(`\n조합원명부에 없는 코나카드 ${notFoundInTarget.length}건:`);
            notFoundInTarget.forEach(item => {
                console.warn(`  - ${item.corp} / ${item.name} (${item.empNo}) / ${item.cardNumber}`);
            });
        }

        return { totalUpdated, notFoundInTarget };
    }

    /**
     * 시트별 코나카드 업데이트
     *
     * 매칭 키: 이름 + 사원번호(영문명)
     * 매칭 실패 항목 수집
     */
    private async updateKonacardInSheet(
        sheetName: string,
        empMap: Map<string, KonacardItem>,
        corpName: string
    ): Promise<{ updated: number; notFound: NotFoundKonacardItem[] }> {

        const data = await this.repository.getTargetSheetData(sheetName);

        if (!isValidSheetData(data)) {
            console.error('Invalid sheet data format');
            throw new Error('시트 데이터 형식이 올바르지 않습니다');
        }

        if (data.length < 2) {
            return { updated: 0, notFound: [] };
        }

        const headers = data[0].map(h => String(h).trim());

        const nameCol = headers.indexOf('한글명');
        const empNoCol = headers.indexOf('영문명');
        let konacardCol = headers.indexOf('코나카드');
        let appRegisteredCol = headers.indexOf('코나카드 앱등록여부');

        if (nameCol === -1 || empNoCol === -1) {
            console.error(`${sheetName}: 필수 컬럼 없음 (한글명 또는 영문명)`);
            return { updated: 0, notFound: [] };
        }

        if (konacardCol === -1) {
            konacardCol = headers.length;

            await this.repository.updateTargetSheetData(
                sheetName,
                `${columnToLetter(konacardCol + 1)}1`,
                [['코나카드']]
            );

            await this.repository.formatTargetHeaderRow(sheetName);

            console.log(`"${sheetName}" 시트에 "코나카드" 컬럼 추가`);
        }

        if (appRegisteredCol === -1) {
            appRegisteredCol = konacardCol === headers.length ? konacardCol + 1 : headers.length;

            await this.repository.updateTargetSheetData(
                sheetName,
                `${columnToLetter(appRegisteredCol + 1)}1`,
                [['코나카드 앱등록여부']]
            );

            await this.repository.formatTargetHeaderRow(sheetName);

            console.log(`"${sheetName}" 시트에 "코나카드 앱등록여부" 컬럼 추가`);
        }

        const targetKrewMap = new Map<string, number>();

        for (let i = 1; i < data.length; i++) {
            const name = String(data[i][nameCol] ?? "").trim();
            const empNo = String(data[i][empNoCol] ?? "").trim();

            if (name && empNo) {
                const uniqueKey = `${name}:${empNo}`;
                targetKrewMap.set(uniqueKey, i);
            }
        }

        const updates: Array<{
            row: number;
            cardNumber: string;
            appRegistered: string
        }> = [];

        const notFound: NotFoundKonacardItem[] = [];

        for (const [uniqueKey, konacardData] of empMap.entries()) {
            if (targetKrewMap.has(uniqueKey)) {
                const rowIndex = targetKrewMap.get(uniqueKey)!;
                updates.push({
                    row: rowIndex + 1,  // 1-indexed
                    cardNumber: konacardData.cardNumber,
                    appRegistered: konacardData.appRegistered,
                });
            } else {
                notFound.push({
                    corp: corpName,
                    name: konacardData.name,
                    empNo: konacardData.empNo,
                    cardNumber: konacardData.cardNumber
                });
            }
        }

        if (updates.length > 0) {
            const batchUpdates: Array<{ range: string; values: SheetData }> = [];

            for (const update of updates) {
                batchUpdates.push({
                    range: `${columnToLetter(konacardCol + 1)}${update.row}`,
                    values: [[update.cardNumber]]
                });

                batchUpdates.push({
                    range: `${columnToLetter(appRegisteredCol + 1)}${update.row}`,
                    values: [[update.appRegistered]]
                });
            }

            if (batchUpdates.length > 200) {
                await this.repository.batchUpdateTargetWithChunks(sheetName, batchUpdates, 100);
            } else {
                await this.repository.batchUpdateTargetSheet(sheetName, batchUpdates);
            }

            console.log(`${sheetName}: ${updates.length}개 코나카드 업데이트 완료 (Batch)`);
        }

        await this.repository.autoResizeTargetColumns(sheetName, konacardCol, appRegisteredCol);

        return { updated: updates.length, notFound };
    }
}

export const syncService = new SyncService();
