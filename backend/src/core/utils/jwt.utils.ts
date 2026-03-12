import { sign, verify } from 'hono/jwt';
import { z } from 'zod';

const AuthJWTPayloadSchema = z.object({
    email: z.string().email(),
    name: z.string(),
    iat: z.number(),
    exp: z.number(),
});

export type AuthJWTPayload = z.infer<typeof AuthJWTPayloadSchema>;

const JWT_SECRET = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
})();

const JWT_EXPIRES_IN = 24 * 60 * 60;

/**
 * JWT 토큰 생성
 */
export async function generateToken(email: string, name: string): Promise<string> {
    const payload: AuthJWTPayload = {
        email,
        name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN
    };

    return await sign(payload, JWT_SECRET);
}

/**
 * JWT 토큰 검증 (런타임 검증 포함)
 */
export async function verifyToken(token: string): Promise<AuthJWTPayload | null> {
    try {
        const payload = await verify(token, JWT_SECRET, 'HS256');

        const validated = AuthJWTPayloadSchema.safeParse(payload);

        if (!validated.success) {
            console.error('Token payload validation failed:', validated.error);
            return null;
        }

        return validated.data;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Authorization 헤더에서 토큰 추출
 * Format: "Bearer <token>"
 */
export function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}
