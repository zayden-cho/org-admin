export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string | null;
    description?: string;
    backgroundColor: string;
    borderColor: string;
    type: "meeting" | "event" | "assembly" | "other";
}

export interface CalendarEventRaw {
    id?: string | null;
    summary?: string | null;
    description?: string | null;
    start?: {
        dateTime?: string | null;
        date?: string | null;
    };
    end?: {
        dateTime?: string | null;
        date?: string | null;
    };
}