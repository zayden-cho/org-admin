import { z } from 'zod';

// Query params
export const GetEventsQuerySchema = z.object({
    refresh: z.enum(['true', 'false']).optional().default('false')
});

// Path params
export const GetMonthEventsParamSchema = z.object({
    year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits'),
    month: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Month must be 1-12')
});

// Export types
export type GetEventsQuery = z.infer<typeof GetEventsQuerySchema>;
export type GetMonthEventsParam = z.infer<typeof GetMonthEventsParamSchema>;
