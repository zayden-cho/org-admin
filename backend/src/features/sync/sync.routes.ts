import { Hono } from 'hono';

import { syncController } from '@/features/sync/sync.controller';

const syncRouter = new Hono();

// POST /api/sync/krews
syncRouter.post('/krews', (c) => syncController.syncAllKrews(c));

// POST /api/sync/konacards
syncRouter.post('/konacards', (c) => syncController.syncAllKonacards(c));

export default syncRouter;
