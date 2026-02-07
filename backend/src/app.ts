import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { readFileSync } from 'fs';
import { serveStatic } from 'hono/bun';
import path from 'path';

import { corsConfig } from '@/core/config/cors.config';
import { errorHandler } from '@/core/middlewares/error';

import calendarRouter from '@/features/calendar/calendar.routes';
import krewsRouter from '@/features/krews/krews.routes';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors(corsConfig));

app.get('/health', (c) => c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
}));

app.route('/api/calendar', calendarRouter);
app.route('/api/krews', krewsRouter);

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
