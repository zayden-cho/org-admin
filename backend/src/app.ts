import { readFileSync } from 'fs';
import path from 'path';

import { Hono } from 'hono';

import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { corsConfig } from '@/core/config/cors.config';
import { authMiddleware } from '@/core/middlewares/auth.middleware';
import { errorHandler } from '@/core/middlewares/error.middleware';
import { apiRateLimiter, syncRateLimiter } from '@/core/middlewares/ratelimit.middleware';
import { cspMiddleware, hstsMiddleware } from '@/core/middlewares/security.middleware';
import authRouter from '@/features/auth/auth.routes';
import calendarRouter from '@/features/calendar/calendar.routes';
import krewsRouter from '@/features/krews/krews.routes';
import syncRouter from '@/features/sync/sync.routes';

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const STATIC_PATH = path.join(process.cwd(), '..', 'frontend', 'dist');

const app = new Hono();

app.use('*', logger());
app.use('*', cspMiddleware);
app.use('*', hstsMiddleware);
app.use('/api/*', cors(corsConfig));
app.use('/api/*', apiRateLimiter);

// Health check
app.get('/health', (c) => c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
}));

// Auth routes (인증 불필요)
app.route('/api/auth', authRouter);

// Protected routes (인증 필요)
app.use('/api/calendar/*', authMiddleware);
app.use('/api/krews/*', authMiddleware);
app.use('/api/sync/*', authMiddleware);

app.route('/api/calendar', calendarRouter);
app.route('/api/krews', krewsRouter);

app.use('/api/sync/*', syncRateLimiter);
app.route('/api/sync', syncRouter);

// Static file serving (Production only)
if (IS_PRODUCTION) {
    console.log(`Serving static files from: ${STATIC_PATH}`);
    app.use('*', serveStatic({ root: STATIC_PATH }));
}

// 404 Handler
app.notFound((c) => {
    // Production: SPA fallback to index.html
    if (IS_PRODUCTION) {
        const indexPath = path.join(STATIC_PATH, 'index.html');
        const html = readFileSync(indexPath, 'utf-8');
        return c.html(html);
    }

    // Development: JSON error response
    return c.json({
        success: false,
        error: 'Not Found',
        path: c.req.path,
    }, 404);
});

// Error Handler
app.onError(errorHandler);

export default app;
