import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class CalendarService {
    static async getEvents() {
        return await axios.get(`${API_BASE_URL}/api/calendar/events`);
    }
}
