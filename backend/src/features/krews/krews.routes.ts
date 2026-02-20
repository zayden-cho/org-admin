import { Hono } from 'hono';

import { krewsController } from '@/features/krews/krews.controller';

const krewsRouter = new Hono();

krewsRouter.get('/', (c) => krewsController.getAllKrews(c));
krewsRouter.get('/corp/:corp', (c) => krewsController.getKrewsByCorp(c));
krewsRouter.get('/detail/:id', (c) => krewsController.getKrewById(c));
krewsRouter.post('/sync', (c) => krewsController.syncKrews(c));

export default krewsRouter;
