import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class CalendarService {
    static async getEvents() {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/calendar`);
            return response;
        } catch (error) {
            console.error('Calendar service error:', error);
            throw error;
        }
    }
}
