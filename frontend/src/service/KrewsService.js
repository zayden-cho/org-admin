import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class KrewsService {
    /**
     * 전체 조합원 조회
     */
    static async getKrews(forceRefresh = false) {
        const url = forceRefresh
            ? `${API_BASE_URL}/api/krews?refresh=true`
            : `${API_BASE_URL}/api/krews`;
        return await axios.get(url);
    }
}
