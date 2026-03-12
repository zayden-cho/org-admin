import type { Context } from 'hono';

import { verifyToken } from '@/core/utils/jwt.utils';
import { authService } from '@/features/auth/auth.service';

export class AuthController {
    /**
     * POST /api/auth/google
     * Google OAuth 로그인
     */
    async login(c: Context) {
        try {
            const { idToken } = await c.req.json();

            if (!idToken) {
                return c.json({
                    success: false,
                    error: 'ID token is required'
                }, 400);
            }

            const authToken = await authService.login(idToken);

            return c.json({
                success: true,
                token: authToken.token,
                user: authToken.user
            });

        } catch (error) {
            console.error('Login error:', error);

            if (error instanceof Error) {
                if (error.message === 'Email not authorized') {
                    return c.json({
                        success: false,
                        error: 'This email is not authorized to access the system'
                    }, 403);
                }

                if (error.message === 'Invalid Google token' || error.message === 'Email not verified') {
                    return c.json({
                        success: false,
                        error: 'Invalid Google token'
                    }, 401);
                }
            }

            return c.json({
                success: false,
                error: 'Login failed'
            }, 500);
        }
    }

    /**
     * GET /api/auth/verify
     * JWT 토큰 검증
     */
    async verify(c: Context) {
        try {
            const authHeader = c.req.header('Authorization');
            if (!authHeader) {
                return c.json({
                    success: false,
                    error: 'No authorization header'
                }, 401);
            }

            const token = authHeader.replace('Bearer ', '');
            const payload = await verifyToken(token);

            if (!payload) {
                return c.json({
                    success: false,
                    error: 'Invalid token'
                }, 401);
            }

            return c.json({
                success: true,
                data: {
                    email: payload.email,
                    name: payload.name
                }
            });

        } catch (error) {
            console.error('Token verification error:', error);
            return c.json({
                success: false,
                error: 'Token verification failed'
            }, 401);
        }
    }

    /**
     * POST /api/auth/logout
     * 로그아웃 (클라이언트에서 토큰 삭제)
     */
    async logout(c: Context) {
        return c.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
}

export const authController = new AuthController();
