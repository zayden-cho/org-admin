import { Hono } from 'hono';

import { zValidator } from '@hono/zod-validator';

import { authController } from '@/features/auth/auth.controller';
import { GoogleLoginBodySchema } from '@/features/auth/auth.schemas';

const authRouter = new Hono();

// POST /api/auth/google
authRouter.post(
    '/google',
    zValidator('json', GoogleLoginBodySchema),
    (c) => authController.login(c)
);

// GET /api/auth/verify
authRouter.get('/verify', (c) => authController.verify(c));

// POST /api/auth/logout
authRouter.post('/logout', (c) => authController.logout(c));

export default authRouter;
