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
            ttl: 5 * 60 * 1000,  // 5분 캐시
        };
    }

    /**
     * 캐시 유효성 확인
     */
    private isCacheValid(): boolean {
        if (!this.cache.data) return false;

        const now = Date.now();
        const age = now - this.cache.timestamp;

        return age < this.cache.ttl;
    }

    /**
     * 전체 조합원 조회
     */
    async getAllKrews(forceRefresh: boolean = false): Promise<KrewRawData[]> {
        if (!forceRefresh && this.isCacheValid()) {
            return this.cache.data!;
        }

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

        return sorted;
    }
}

export const krewsService = new KrewsService();
