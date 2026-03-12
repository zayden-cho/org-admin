import { OAuth2Client } from 'google-auth-library';

import { generateToken } from '@/core/utils/jwt.utils';
import { authRepository } from '@/features/auth/auth.repository';
import type { GoogleUser, AuthToken } from '@/features/auth/auth.types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export class AuthService {
    /**
     * Google ID 토큰을 검증하고 사용자 정보 반환
     */
    async verifyGoogleToken(idToken: string): Promise<GoogleUser> {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Invalid token payload');
            }

            if (!payload.email || !payload.email_verified) {
                throw new Error('Email not verified');
            }

            return {
                email: payload.email,
                name: payload.name || '',
                picture: payload.picture || '',
                email_verified: payload.email_verified
            };
        } catch (error) {
            console.error('Google token verification failed:', error);
            throw new Error('Invalid Google token');
        }
    }

    /**
     * Google 로그인 처리
     */
    async login(idToken: string): Promise<AuthToken> {
        // 1. Google 토큰 검증
        const googleUser = await this.verifyGoogleToken(idToken);

        // 2. 이메일 화이트리스트 체크
        if (!authRepository.isEmailAllowed(googleUser.email)) {
            throw new Error('Email not authorized');
        }

        // 3. JWT 토큰 생성
        const token = await generateToken(googleUser.email, googleUser.name);

        return {
            token,
            user: {
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture
            }
        };
    }

    /**
     * 이메일이 허용되었는지 확인
     */
    isEmailAllowed(email: string): boolean {
        return authRepository.isEmailAllowed(email);
    }
}

export const authService = new AuthService();
