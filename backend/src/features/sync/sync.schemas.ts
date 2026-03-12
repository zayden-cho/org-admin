import { z } from 'zod';

// Path params
export const SyncCorpParamSchema = z.object({
    corp: z.string().min(1, 'Corporation name is required')
});

// Export types
export type SyncCorpParam = z.infer<typeof SyncCorpParamSchema>;
