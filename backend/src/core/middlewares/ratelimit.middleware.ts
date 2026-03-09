import { Context, Next } from 'hono';

// ========================================
// Rate Limiter 저장소 (메모리 기반)
// ========================================

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// 주기적으로 만료된 항목 정리 (1분마다)
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 60 * 1000);

// ========================================
// Rate Limiter 생성 함수
// ========================================

interface RateLimiterOptions {
    windowMs: number;  // 시간 윈도우 (밀리초)
    max: number;       // 최대 요청 수
    message?: string;  // 에러 메시지
    keyGenerator?: (c: Context) => string;  // Key 생성 함수
}

/**
 * Rate Limiter 미들웨어 생성
 */
export function createRateLimiter(options: RateLimiterOptions) {
    const {
        windowMs,
        max,
        message = 'Too many requests, please try again later.',
        keyGenerator = (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    } = options;

    return async (c: Context, next: Next) => {
        const key = keyGenerator(c);
        const now = Date.now();

        // 저장소에서 현재 키의 정보 가져오기
        let record = store[key];

        // 기록이 없거나 시간이 초과된 경우 초기화
        if (!record || record.resetTime < now) {
            record = {
                count: 0,
                resetTime: now + windowMs,
            };
            store[key] = record;
        }

        // 요청 카운트 증가
        record.count++;

        // Rate Limit 헤더 설정
        c.header('X-RateLimit-Limit', max.toString());
        c.header('X-RateLimit-Remaining', Math.max(0, max - record.count).toString());
        c.header('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

        // 제한 초과 확인
        if (record.count > max) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            c.header('Retry-After', retryAfter.toString());

            return c.json({
                success: false,
                error: message,
                retryAfter,
            }, 429);
        }

        await next();
    };
}

// ========================================
// 사전 정의된 Rate Limiters
// ========================================

/**
 * 일반 API Rate Limiter
 * - 1분당 60번 요청 제한
 */
export const apiRateLimiter = createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1분
    max: 60,
    message: 'Too many requests, please try again later.',
});

/**
 * 동기화 API Rate Limiter
 * - 5분당 10번 요청 제한
 */
export const syncRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5분
    max: 10,
    message: 'Sync operations are rate limited. Please wait before retrying.',
});

/**
 * 로그인 API Rate Limiter
 * - 15분당 5번 요청 제한 (Brute Force 방지)
 */
export const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5,
    message: 'Too many login attempts. Please try again later.',
    keyGenerator: (c) => {
        // IP + User Agent 조합
        const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
        const ua = c.req.header('user-agent') || 'unknown';
        return `${ip}-${ua.substring(0, 50)}`; // UA는 50자까지만
    },
});
