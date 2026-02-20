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
        console.log('========================================');
        console.log('getAllKrews called');
        console.log('forceRefresh:', forceRefresh);
        console.log('cache.data exists:', !!this.cache.data);

        if (!forceRefresh && this.isCacheValid()) {
            console.log('Returning cached data! (length:', this.cache.data!.length, ')');
            console.log('========================================');
            return {
                data: this.cache.data!,
                fromCache: true
            };
        }

        console.log('Fetching from Google Sheets...');
        const startTime = Date.now();

        const sheetDataMap = await this.repository.getAllKrewsSheetsData();

        const krews: KrewRawData[] = [];

        for (const [sheetName, values] of sheetDataMap.entries()) {
            if (values.length < 2) continue;

            const headers = values[0].map(h => String(h).trim());

            const colIndex: Record<string, number> = {};
            for (const [koreanName, englishName] of Object.entries(KREW_HEADER_MAP)) {
                const idx = headers.indexOf(koreanName);
                if (idx !== -1) {
                    colIndex[englishName] = idx;
                }
            }

            const orgChartStartIndex = headers.indexOf('조직도');

            for (let i = 1; i < values.length; i++) {
                const row = values[i];

                if (row.every(cell => !cell || String(cell).trim() === '')) {
                    continue;
                }

                let orgChart: string[] = [];

                if (orgChartStartIndex !== -1 && orgChartStartIndex < row.length) {
                    orgChart = row.slice(orgChartStartIndex)
                        .filter(cell => cell && String(cell).trim() !== '')
                        .map(cell => String(cell).trim());
                }

                const krew: KrewRawData = {
                    corpId: row[colIndex['corpId']] || '',
                    krewId: row[colIndex['krewId']] || '',
                    corp: row[colIndex['corp']] || sheetName,
                    name: row[colIndex['name']] || '',
                    ldap: row[colIndex['ldap']] || '',
                    phoneNumber: row[colIndex['phoneNumber']] || '',
                    isCheckoff: row[colIndex['isCheckoff']] || '',
                    status: row[colIndex['status']] || '',
                    joinMonth: row[colIndex['joinMonth']] || '',
                    konacard: row[colIndex['konacard']] || '',
                    konacardAppRegistered: row[colIndex['konacardAppRegistered']] || '',
                    position: row[colIndex['position']] || '',
                    orgChart,
                };

                krews.push(krew);
            }
        }

        const sorted = krews.sort((a, b) => {
            const aNum = parseInt(a.krewId.replace('ku-', '')) || 0;
            const bNum = parseInt(b.krewId.replace('ku-', '')) || 0;
            return aNum - bNum;
        });

        this.cache.data = sorted;
        this.cache.timestamp = Date.now();

        const elapsed = Date.now() - startTime;

        console.log('Data fetched and cached!');
        console.log('items:', sorted.length);
        console.log('elapsed:', `${elapsed}ms`);
        console.log('========================================');

        return {
            data: sorted,
            fromCache: false
        };
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

        return result.data.find(krew => krew.krewId === id) || null;
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
