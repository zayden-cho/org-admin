// ========================================
// CORS Configuration
// ========================================

type Environment = 'development' | 'production' | 'test';

// ========================================
// 환경별 기본 허용 도메인
// ========================================
const defaultOrigins: Record<Environment, string[]> = {
    development: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000',
    ],
    production: [
        'https://org-admin.onrender.com',
    ],
    test: [
        'http://localhost:3000',
        'http://localhost:5173',
    ],
};

// ========================================
// 허용된 Origin 목록 생성
// ========================================
function getAllowedOrigins(): string[] {
    const env = (process.env.NODE_ENV as Environment) || 'development';

    let origins = [...defaultOrigins[env]];

    // 프로덕션: 환경변수에서 추가 도메인 로드
    if (env === 'production') {
        const additionalOrigins = process.env.ALLOWED_ORIGINS;

        if (additionalOrigins) {
            const extraOrigins = additionalOrigins
                .split(',')
                .map((origin: string) => origin.trim())
                .filter((origin: string) => origin.length > 0);

            origins = [...origins, ...extraOrigins];

            console.log('✅ Additional CORS origins loaded:', extraOrigins);
        }
    }

    // 개발: 커스텀 포트 지원
    if (env === 'development') {
        const customPort = process.env.FRONTEND_DEV_PORT;
        if (customPort) {
            origins.push(`http://localhost:${customPort}`);
            origins.push(`http://127.0.0.1:${customPort}`);
        }
    }

    return [...new Set(origins)];
}

// ========================================
// CORS 설정 (Hono)
// ========================================
export const corsConfig = {
    origin: getAllowedOrigins(),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],
    exposeHeaders: [
        'Content-Length',
        'Content-Type',
        'X-Request-Id',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86400,
};

// ========================================
// 시작 시 CORS 설정 로깅
// ========================================
const env = (process.env.NODE_ENV as Environment) || 'development';
const allowedOrigins = corsConfig.origin as string[];

console.log(`\n🌐 CORS Configuration (${env}):`);
console.log(`   Allowed Origins (${allowedOrigins.length}):`);
allowedOrigins.forEach((origin: string, index: number) => {
    console.log(`   ${index + 1}. ${origin}`);
});
console.log('');
