import { Hono } from 'hono';

import { syncController } from '@/features/sync/sync.controller';

const syncRouter = new Hono();

syncRouter.post('/all', (c) => syncController.syncAllKrews(c));
syncRouter.post('/corp/:corp', (c) => syncController.syncCorpKrews(c));
syncRouter.post('/konacard/:corp', (c) => syncController.syncCorpKonacards(c));

export default syncRouter;
