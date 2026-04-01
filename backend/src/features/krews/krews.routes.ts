import { Hono } from 'hono';

import { zValidator } from '@hono/zod-validator';

import { krewsController } from '@/features/krews/krews.controller';

import {
    GetAllKrewsQuerySchema,
    GetKrewByCorpParamSchema,
    GetKrewByIdParamSchema
} from './krews.schemas';

const krewsRouter = new Hono();

// GET /api/krews?refresh=true
krewsRouter.get(
    '/',
    zValidator('query', GetAllKrewsQuerySchema),
    (c) => krewsController.getAllKrews(c)
);

// GET /api/krews/corp/:corp
krewsRouter.get(
    '/corp/:corp',
    zValidator('param', GetKrewByCorpParamSchema),
    (c) => krewsController.getKrewsByCorp(c)
);

// GET /api/krews/detail/:id
krewsRouter.get(
    '/detail/:id',
    zValidator('param', GetKrewByIdParamSchema),
    (c) => krewsController.getKrewById(c)
);

// POST /api/krews/sync
krewsRouter.post('/sync', (c) => krewsController.syncKrews(c));

// GET /api/krews/statistics?refresh=true
krewsRouter.get(
    '/statistics',
    zValidator('query', GetAllKrewsQuerySchema),
    (c) => krewsController.getKrewsStatistics(c)
);

export default krewsRouter;
