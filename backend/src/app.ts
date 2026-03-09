import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { readFileSync } from 'fs';
import { serveStatic } from 'hono/bun';
import path from 'path';

import { corsConfig } from '@/core/config/cors.config';
import { errorHandler } from '@/core/middlewares/error.middleware';
import { apiRateLimiter, syncRateLimiter } from '@/core/middlewares/ratelimit.middleware';
import { cspMiddleware, hstsMiddleware } from '@/core/middlewares/security.middleware';

import calendarRouter from '@/features/calendar/calendar.routes';
import krewsRouter from '@/features/krews/krews.routes';
import syncRouter from '@/features/sync/sync.routes';

const app = new Hono();

app.use('*', logger());
app.use('*', cspMiddleware);
app.use('*', hstsMiddleware);
app.use('/api/*', cors(corsConfig));
app.use('/api/*', apiRateLimiter);

app.get('/health', (c) => c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
}));

app.route('/api/calendar', calendarRouter);
app.route('/api/krews', krewsRouter);

app.use('/api/sync/*', syncRateLimiter);
app.route('/api/sync', syncRouter);

if (process.env.NODE_ENV === 'production') {
    const staticPath = path.join(process.cwd(), '..', 'frontend', 'dist');

    console.log(`Serving static files from:`, staticPath);

    app.use('*', serveStatic({ root: staticPath }));
}

app.notFound((c) => {
    if (process.env.NODE_ENV === 'production') {
        const staticPath = path.join(process.cwd(), '..', 'frontend', 'dist');
        const indexPath = path.join(staticPath, 'index.html');

        const html = readFileSync(indexPath, 'utf-8');
        return c.html(html);
    }

    return c.json({
        success: false,
        error: 'Not Found',
        path: c.req.path,
    }, 404);
});

app.onError(errorHandler);

export default app;
