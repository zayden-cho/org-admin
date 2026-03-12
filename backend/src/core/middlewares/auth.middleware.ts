import type { Context, Next } from 'hono';

import { extractToken, verifyToken } from '@/core/utils/jwt.utils';

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
        return c.json({
            success: false,
            error: 'Unauthorized - No token provided'
        }, 401);
    }

    const payload = await verifyToken(token);

    if (!payload) {
        return c.json({
            success: false,
            error: 'Unauthorized - Invalid token'
        }, 401);
    }

    // 사용자 정보를 context에 저장
    c.set('user', {
        email: payload.email,
        name: payload.name
    });

    await next();
}
