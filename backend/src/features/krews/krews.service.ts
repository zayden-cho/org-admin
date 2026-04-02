import { cellToString, getErrorMessage } from '@/core/types/sheets.types';
import { KrewsRepository } from '@/features/krews/krews.repository';
import { KREW_HEADER_MAP, KrewRawData } from '@/features/krews/krews.types';

interface EnrichedKrewData extends KrewRawData {
    fullOrgChart?: string[];
}

export class KrewsService {
    private repository: KrewsRepository;

    private cache: {
        data: EnrichedKrewData[] | null;
        timestamp: number;
        ttl: number;
    };

    constructor() {
        this.repository = new KrewsRepository();

        this.cache = {
            data: null,
            timestamp: 0,
            ttl: 5 * 60 * 1000,  // 5분
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
     * 캐시 무효화 (sync 후 호출)
     * 다음 요청 시 자동으로 새로 로드됨
     */
    clearCache(): void {
        this.cache.data = null;
        this.cache.timestamp = 0;

        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev) {
            console.log('크루 데이터 캐시 무효화 완료');
        }
    }

    /**
     * 전체 조합원 조회 (통합 데이터 - 조직도 검색 가능)
     * @returns { data, fromCache }
     */
    async getAllKrews(forceRefresh: boolean = false): Promise<{ data: EnrichedKrewData[], fromCache: boolean }> {
        const isDev = process.env.NODE_ENV !== 'production';

        if (isDev) {
            console.log('========================================');
            console.log('getAllKrews called');
            console.log('forceRefresh:', forceRefresh);
            console.log('cache.data exists:', !!this.cache.data);
        }

        if (!forceRefresh && this.isCacheValid()) {
            if (isDev) {
                console.log('Returning cached enriched data! (length:', this.cache.data!.length, ')');
                console.log('========================================');
            }
            return {
                data: this.cache.data!,
                fromCache: true
            };
        }

        if (isDev) {
            console.log('Fetching and enriching data from Google Sheets...');
        }
        const startTime = Date.now();

        try {
            // 1. 크루유니언 시트 로드
            const unionValues = await this.repository.getSheetData('크루유니언');

            if (unionValues.length < 2) {
                if (isDev) {
                    console.log('크루유니언 시트가 비어있습니다.');
                    console.log('========================================');
                }
                return {
                    data: [],
                    fromCache: false
                };
            }

            const headers = unionValues[0].map(h => String(h).trim());
            const colIndex: Record<string, number> = {};

            for (const [koreanName, englishName] of Object.entries(KREW_HEADER_MAP)) {
                const idx = headers.indexOf(koreanName);
                if (idx !== -1) {
                    colIndex[englishName] = idx;
                }
            }

            const orgChartStartIndex = headers.indexOf('조직도');
            const krews: KrewRawData[] = [];

            for (let i = 1; i < unionValues.length; i++) {
                const row = unionValues[i];
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

            if (isDev) {
                const elapsed = Date.now() - startTime;
                console.log(`크루유니언 로드 완료: ${krews.length}명 (${elapsed}ms)`);
            }

            // 2. 법인 시트 데이터 병렬 로드 및 통합
            const enrichedData = await this.enrichKrewsWithCorpData(krews);

            // 3. 캐시 저장
            this.cache.data = enrichedData;
            this.cache.timestamp = Date.now();

            if (isDev) {
                const elapsed = Date.now() - startTime;
                console.log('Data fetched and enriched!');
                console.log('items:', enrichedData.length);
                console.log('total elapsed:', elapsed + 'ms');
                console.log('========================================');
            }

            return {
                data: enrichedData,
                fromCache: false
            };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            console.error('Failed to fetch data from 크루유니언:', errorMessage);
            throw new Error('크루유니언 시트를 불러올 수 없습니다.');
        }
    }

    /**
     * 법인 시트 데이터와 통합 (병렬 로딩)
     */
    private async enrichKrewsWithCorpData(unionData: KrewRawData[]): Promise<EnrichedKrewData[]> {
        const isDev = process.env.NODE_ENV !== 'production';
        const startTime = Date.now();

        // 법인 목록 추출
        const corps = [...new Set(unionData.map(k => k.corp))].filter(Boolean);

        if (isDev) {
            console.log(`법인 시트 병렬 로딩 시작: ${corps.length}개`);
        }

        // 🚀 병렬로 모든 법인 시트 로드
        const corpDataPromises = corps.map(async (corp) => {
            try {
                const corpData = await this.repository.getSheetData(corp);
                return { corp, data: corpData };
            } catch (error) {
                console.error(`Failed to load corp sheet: ${corp}`, error);
                return { corp, data: [] };
            }
        });

        const corpDataResults = await Promise.all(corpDataPromises);

        // Map으로 변환
        const corpDataMap = new Map<string, any[]>();
        corpDataResults.forEach(({ corp, data }) => {
            corpDataMap.set(corp, data);
        });

        if (isDev) {
            const elapsed = Date.now() - startTime;
            console.log(`법인 시트 병렬 로딩 완료: ${corps.length}개 (${elapsed}ms)`);
        }

        // 데이터 통합
        const enrichedData: EnrichedKrewData[] = unionData.map(krew => {
            const corpData = corpDataMap.get(krew.corp);
            if (!corpData || corpData.length < 2) {
                return krew;
            }

            const headers = corpData[0].map((h: any) => String(h).trim());
            const krewunionIdIndex = headers.indexOf('krewunionId');
            const orgChartStartIndex = headers.indexOf('조직도');

            if (krewunionIdIndex === -1) {
                return krew;
            }

            const matchedRow = corpData.slice(1).find(row =>
                String(row[krewunionIdIndex] || '').trim() === krew.krewunionId
            );

            if (!matchedRow) {
                return krew;
            }

            let fullOrgChart: string[] = [];
            if (orgChartStartIndex !== -1 && orgChartStartIndex < matchedRow.length) {
                fullOrgChart = matchedRow.slice(orgChartStartIndex, matchedRow.length)
                    .filter((cell: any) => cell && String(cell).trim() !== '')
                    .map((cell: any) => String(cell).trim());
            }

            const enrichedKrew: any = { ...krew };

            for (const [koreanName, englishName] of Object.entries(KREW_HEADER_MAP)) {
                if (englishName === 'orgChart') {
                    continue;
                }

                const idx = headers.indexOf(koreanName);
                if (idx !== -1 && matchedRow[idx] !== undefined && matchedRow[idx] !== null) {
                    const value = cellToString(matchedRow[idx]);
                    if (value !== undefined && value !== null) {
                        enrichedKrew[englishName] = value;
                    }
                }
            }

            enrichedKrew.fullOrgChart = fullOrgChart.length > 0 ? fullOrgChart : krew.orgChart;

            if (!enrichedKrew.orgChart || enrichedKrew.orgChart.length === 0) {
                enrichedKrew.orgChart = enrichedKrew.fullOrgChart;
            }

            return enrichedKrew;
        });

        if (isDev) {
            const totalElapsed = Date.now() - startTime;
            console.log(`Enrichment 완료: ${enrichedData.length}명 (${totalElapsed}ms)`);
        }

        return enrichedData;
    }

    /**
     * 조합원 통계 조회
     */
    async getKrewsStatistics(forceRefresh: boolean = false): Promise<any> {
        const isDev = process.env.NODE_ENV !== 'production';

        if (isDev) {
            console.log('조합원 통계 계산 중...');
        }

        const result = await this.getAllKrews(forceRefresh);
        const enrichedData = result.data;

        const statistics = this.calculateStatistics(enrichedData);

        if (isDev) {
            console.log('조합원 통계 계산 완료');
        }

        return statistics;
    }

    /**
     * 통계 계산
     */
    private calculateStatistics(enrichedData: EnrichedKrewData[]) {
        const cmsStatusCounts = {
            registered: 0,
            unpaid: 0,
            notified: 0,
            paused: 0
        };

        enrichedData.forEach(krew => {
            switch(krew.status) {
                case '등록성공':
                    cmsStatusCounts.registered++;
                    break;
                case '안내완료':
                    cmsStatusCounts.notified++;
                    break;
                case '일시정지':
                    cmsStatusCounts.paused++;
                    break;
                case '미납중':
                    cmsStatusCounts.unpaid++;
                    break;
            }
        });

        const total = enrichedData.length;
        const active = cmsStatusCounts.registered + cmsStatusCounts.unpaid + cmsStatusCounts.notified;
        const onLeave = cmsStatusCounts.paused;

        const byCorpData = enrichedData.reduce((acc, k) => {
            const corp = k.corp || '미정';
            if (!acc[corp]) {
                acc[corp] = { total: 0 };
            }
            acc[corp].total++;
            return acc;
        }, {} as Record<string, { total: number }>);

        const byCorp = Object.entries(byCorpData)
            .map(([corp, data]) => ({
                corp,
                total: data.total
            }))
            .sort((a, b) => b.total - a.total);

        const byCheckoff = enrichedData.reduce((acc, k) => {
            const checkoff = k.isCheckoff || '미정';
            acc[checkoff] = (acc[checkoff] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chatRoomStats = {
            joined: enrichedData.filter(k => k.chatRoomJoined === 'Y').length,
            notJoined: enrichedData.filter(k => !k.chatRoomJoined || k.chatRoomJoined === 'N').length
        };

        const konacardStats = {
            registered: enrichedData.filter(k => k.konacard && k.konacard.trim() !== '').length,
            notRegistered: enrichedData.filter(k => !k.konacard || k.konacard.trim() === '').length
        };

        const byJoinMonth = enrichedData.reduce((acc, k) => {
            const month = k.joinMonth || '미정';
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const joinMonthDistribution = Object.entries(byJoinMonth)
            .map(([month, count]) => ({ month, count }))
            .filter(item => item.month !== '미정')
            .sort((a, b) => a.month.localeCompare(b.month));

        const konacardByCorp = Object.entries(byCorpData)
            .map(([corp]) => {
                const corpKrews = enrichedData.filter(k => k.corp === corp);
                const registered = corpKrews.filter(k => k.konacard && k.konacard.trim() !== '').length;
                const notRegistered = corpKrews.filter(k => !k.konacard || k.konacard.trim() === '').length;

                return {
                    corp,
                    registered,
                    notRegistered,
                    total: corpKrews.length,
                    rate: corpKrews.length > 0 ? Math.round((registered / corpKrews.length) * 100) : 0
                };
            })
            .filter(item => item.total > 0)
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 15);

        return {
            total,
            active,
            onLeave,
            cmsStats: cmsStatusCounts,
            byCorp,
            byCheckoff,
            chatRoomStats,
            konacardStats,
            joinMonthDistribution,
            konacardByCorp
        };
    }

    async getKrewById(id: string): Promise<EnrichedKrewData | null> {
        const result = await this.getAllKrews();
        return result.data.find(krew => krew.krewunionId === id) || null;
    }

    async getKrewDetailById(id: string): Promise<EnrichedKrewData | null> {
        return this.getKrewById(id);
    }
}

export const krewsService = new KrewsService();
