import { z } from 'zod';

// Query params
export const GetAllKrewsQuerySchema = z.object({
    refresh: z.enum(['true', 'false']).optional().default('false')
});

// Path params
export const GetKrewByCorpParamSchema = z.object({
    corp: z.string().min(1, 'Corporation name is required')
});

export const GetKrewByIdParamSchema = z.object({
    id: z.string().min(1, 'Krew ID is required')
});

// Export types
export type GetAllKrewsQuery = z.infer<typeof GetAllKrewsQuerySchema>;
export type GetKrewByCorpParam = z.infer<typeof GetKrewByCorpParamSchema>;
export type GetKrewByIdParam = z.infer<typeof GetKrewByIdParamSchema>;
