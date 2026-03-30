import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class EventsService {
    /**
     * 전체 행사 목록 조회
     */
    static async getEvents(forceRefresh = false) {
        const url = forceRefresh ? `${API_BASE_URL}/api/events?refresh=true` : `${API_BASE_URL}/api/events`;
        return await axios.get(url);
    }

    /**
     * 특정 행사 조회
     */
    static async getEventById(eventId) {
        return await axios.get(`${API_BASE_URL}/api/events/${eventId}`);
    }

    /**
     * 행사 일정 조회
     */
    static async getEventSchedules(eventId, forceRefresh = false) {
        const url = forceRefresh ? `${API_BASE_URL}/api/events/${eventId}/schedules?refresh=true` : `${API_BASE_URL}/api/events/${eventId}/schedules`;
        return await axios.get(url);
    }

    /**
     * 행사 참가 신청 조회
     */
    static async getEventApplications(eventId, year, forceRefresh = false) {
        const url = forceRefresh ? `${API_BASE_URL}/api/events/${eventId}/applications/${year}?refresh=true` : `${API_BASE_URL}/api/events/${eventId}/applications/${year}`;
        return await axios.get(url);
    }

    /**
     * 캐시 클리어
     */
    static async clearCache() {
        return await axios.post(`${API_BASE_URL}/api/events/cache/clear`);
    }
}
