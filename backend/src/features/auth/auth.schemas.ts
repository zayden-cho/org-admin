import { z } from 'zod';

// Google login request body
export const GoogleLoginBodySchema = z.object({
    idToken: z.string().min(1, 'Google ID token is required')
});

// Export types
export type GoogleLoginBody = z.infer<typeof GoogleLoginBodySchema>;
