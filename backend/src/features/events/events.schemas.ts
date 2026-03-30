import { z } from 'zod';

// Query params
export const GetEventsQuerySchema = z.object({
    refresh: z.enum(['true', 'false']).optional().default('false')
});

// Path params
export const GetEventByIdParamSchema = z.object({
    eventId: z.string().min(1, 'Event ID is required')
});

export const GetEventSchedulesParamSchema = z.object({
    eventId: z.string().min(1, 'Event ID is required')
});

export const GetEventApplicationsParamSchema = z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits')
});

export const GetUserEventStatsParamSchema = z.object({
    krewId: z.string().min(1, 'Krew ID is required')
});

// Body schemas
export const SyncEventApplicationsBodySchema = z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    sourceSpreadsheetId: z.string().min(1, 'Source spreadsheet ID is required'),
    sourceSheetName: z.string().min(1, 'Source sheet name is required'),
    targetMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Target month must be YYYY-MM format')
});

// Export types
export type GetEventsQuery = z.infer<typeof GetEventsQuerySchema>;
export type GetEventByIdParam = z.infer<typeof GetEventByIdParamSchema>;
export type GetEventSchedulesParam = z.infer<typeof GetEventSchedulesParamSchema>;
export type GetEventApplicationsParam = z.infer<typeof GetEventApplicationsParamSchema>;
export type GetUserEventStatsParam = z.infer<typeof GetUserEventStatsParamSchema>;
export type SyncEventApplicationsBody = z.infer<typeof SyncEventApplicationsBodySchema>;
