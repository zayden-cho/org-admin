import { Hono } from 'hono';

import { krewsController } from '@/features/krews/krews.controller';

const krewsRouter = new Hono();

krewsRouter.get('/', (c) => krewsController.getAllKrews(c));

export default krewsRouter;
