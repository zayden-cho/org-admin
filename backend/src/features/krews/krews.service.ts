import { cellToString, getErrorMessage } from '@/core/types/sheets.types';
import { KrewsRepository } from '@/features/krews/krews.repository';
import { KREW_HEADER_MAP, KrewRawData } from '@/features/krews/krews.types';

export class KrewsService {
    private repository: KrewsRepository;
    private cache: {
        data: KrewRawData[] | null;
        timestamp: number;
        ttl: number;
    };

    constructor() {
        this.repository = new KrewsRepository();

        this.cache = {
            data: null,
            timestamp: 0,
            ttl: 5 * 60 * 1000,
        };
    }

    /**
     * 캐시 유효성 확인
     */
    private isCacheValid(): boolean {
        if (!this.cache.data) {
            return false;
        }

        const now = Date.now();
        const age = now - this.cache.timestamp;

        return age < this.cache.ttl;
    }

    /**
     * 전체 조합원 조회
     * @returns { data, fromCache }
     */
    async getAllKrews(forceRefresh: boolean = false): Promise<{ data: KrewRawData[], fromCache: boolean }> {
        const isDev = process.env.NODE_ENV !== 'production';

        if (isDev) {
            console.log('========================================');
            console.log('getAllKrews called');
            console.log('forceRefresh:', forceRefresh);
            console.log('cache.data exists:', !!this.cache.data);
        }

        if (!forceRefresh && this.isCacheValid()) {
            if (isDev) {
                console.log('Returning cached data! (length:', this.cache.data!.length, ')');
                console.log('========================================');
            }
            return {
                data: this.cache.data!,
                fromCache: true
            };
        }

        if (isDev) {
            console.log('Fetching from Google Sheets...');
        }
        const startTime = Date.now();

        try {
            const values = await this.repository.getSheetData('크루유니언');

            if (values.length < 2) {
                if (isDev) {
                    console.log('크루유니언 시트가 비어있습니다.');
                    console.log('========================================');
                }
                return {
                    data: [],
                    fromCache: false
                };
            }

            const headers = values[0].map(h => String(h).trim());
            const colIndex: Record<string, number> = {};

            for (const [koreanName, englishName] of Object.entries(KREW_HEADER_MAP)) {
                const idx = headers.indexOf(koreanName);
                if (idx !== -1) {
                    colIndex[englishName] = idx;
                }
            }

            const orgChartStartIndex = headers.indexOf('조직도');
            const krews: KrewRawData[] = [];

            for (let i = 1; i < values.length; i++) {
                const row = values[i];
                if (row.every(cell => !cell || String(cell).trim() === '')) {
                    continue;
                }

                let orgChart: string[] = [];
                if (orgChartStartIndex !== -1 && orgChartStartIndex < row.length) {
                    orgChart = row.slice(orgChartStartIndex, row.length)
                        .filter(cell => cell && String(cell).trim() !== '')
                        .map(cell => String(cell).trim());
                }

                const krew: KrewRawData = {
                    corpId: cellToString(row[colIndex["corpId"]]),
                    krewunionId: cellToString(row[colIndex["krewunionId"]]),
                    corp: cellToString(row[colIndex["corp"]]),
                    name: cellToString(row[colIndex["name"]]),
                    ldap: cellToString(row[colIndex["ldap"]]),
                    phoneNumber: cellToString(row[colIndex["phoneNumber"]]),
                    isCheckoff: cellToString(row[colIndex["isCheckoff"]]),
                    status: cellToString(row[colIndex["status"]]),
                    joinMonth: cellToString(row[colIndex["joinMonth"]]),
                    chatRoomJoined: cellToString(row[colIndex["chatRoomJoined"]]),
                    konacard: cellToString(row[colIndex["konacard"]]),
                    konacardAppRegistered: cellToString(row[colIndex["konacardAppRegistered"]]),
                    position: cellToString(row[colIndex["position"]]),
                    orgChart
                };

                krews.push(krew);
            }

            const sorted = krews.sort((a, b) => {
                const aNum = parseInt(a.krewunionId.replace(/\D/g, '')) || 0;
                const bNum = parseInt(b.krewunionId.replace(/\D/g, '')) || 0;
                return aNum - bNum;
            });

            this.cache.data = sorted;
            this.cache.timestamp = Date.now();

            const elapsed = Date.now() - startTime;

            if (isDev) {
                console.log('Data fetched and cached from 크루유니언!');
                console.log('items:', sorted.length);
                console.log('elapsed:', `${elapsed}ms`);
                console.log('========================================');
            } else {
                console.log(`Krews data fetched from 크루유니언: ${sorted.length} items in ${elapsed}ms`);
            }

            return {
                data: sorted,
                fromCache: false
            };
        } catch (error) {
            const errorMessage = getErrorMessage(error);

            if (isDev) {
                console.log('크루유니언 시트 조회 실패:', errorMessage);
                console.log('========================================');
            } else {
                console.log('크루유니언 시트 조회 실패. 전체조합원갱신을 먼저 실행해주세요.');
            }

            return {
                data: [],
                fromCache: false
            };
        }
    }

    /**
     * 법인별 조합원 조회
     */
    async getKrewsByCorp(corp: string): Promise<KrewRawData[]> {
        const result = await this.getAllKrews();

        return result.data.filter(krew => krew.corp === corp);
    }

    /**
     * ID로 조합원 조회
     */
    async getKrewById(id: string): Promise<KrewRawData | null> {
        const result = await this.getAllKrews();

        return result.data.find(krew => krew.krewunionId === id) || null;
    }

    /**
     * 캐시 강제 갱신
     */
    async syncKrews(): Promise<{ success: boolean; updated: number }> {
        const result = await this.getAllKrews(true);

        return {
            success: true,
            updated: result.data.length,
        };
    }
}

export const krewsService = new KrewsService();
