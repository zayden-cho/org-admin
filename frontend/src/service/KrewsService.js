import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class KrewsService {
    /**
     * 전체 조합원 조회
     */
    static async getKrews(forceRefresh = false) {
        const url = forceRefresh ? `${API_BASE_URL}/api/krews?refresh=true` : `${API_BASE_URL}/api/krews`;
        return await axios.get(url);
    }

    /**
     * 법인별 조합원 조회
     */
    static async getKrewsByCorp(corp) {
        return await axios.get(`${API_BASE_URL}/api/krews/corp/${corp}`);
    }

    /**
     * 조합원 상세 조회
     */
    static async getKrewById(id) {
        return await axios.get(`${API_BASE_URL}/api/krews/detail/${id}`);
    }

    /**
     * 캐시 강제 갱신
     */
    static async syncKrews() {
        return await axios.post(`${API_BASE_URL}/api/krews/sync`);
    }

    /**
     * 조합원 통계 조회
     */
    static async getKrewsStatistics(forceRefresh = false) {
        const url = forceRefresh ? `${API_BASE_URL}/api/krews/statistics?refresh=true` : `${API_BASE_URL}/api/krews/statistics`;
        return await axios.get(url);
    }

    /**
     * 전체 조합원 동기화 (원본 → 타겟)
     */
    static async syncAllKrews() {
        return await axios.post(`${API_BASE_URL}/api/sync/all`);
    }

    /**
     * 법인별 조합원 동기화
     */
    static async syncCorpKrews(corp) {
        return await axios.post(`${API_BASE_URL}/api/sync/corp/${corp}`);
    }

    /**
     * 법인별 코나카드 동기화
     */
    static async syncCorpKonacards(corp) {
        return await axios.post(`${API_BASE_URL}/api/sync/konacard/${corp}`);
    }
}
