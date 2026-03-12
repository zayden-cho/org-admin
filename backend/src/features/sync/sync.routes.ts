import { Hono } from 'hono';

import { zValidator } from '@hono/zod-validator';

import { syncController } from '@/features/sync/sync.controller';
import { SyncCorpParamSchema } from '@/features/sync/sync.schemas';

const syncRouter = new Hono();

// POST /api/sync/all
syncRouter.post('/all', (c) => syncController.syncAllKrews(c));

// POST /api/sync/corp/:corp
syncRouter.post(
    '/corp/:corp',
    zValidator('param', SyncCorpParamSchema),
    (c) => syncController.syncCorpKrews(c)
);

// POST /api/sync/konacard/:corp
syncRouter.post(
    '/konacard/:corp',
    zValidator('param', SyncCorpParamSchema),
    (c) => syncController.syncCorpKonacards(c)
);

export default syncRouter;
