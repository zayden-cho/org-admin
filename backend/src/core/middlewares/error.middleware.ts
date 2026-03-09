import { Context, Next } from 'hono';

export const errorHandler = (err: Error, c: Context) => {
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: c.req.path,
        method: c.req.method,
    });

    const isDev = process.env.NODE_ENV === 'development';

    if (err.name === 'ValidationError') {
        return c.json({
            success: false,
            error: 'Validation failed',
            details: err.message,
        }, 400);
    }

    if (err.name === 'UnauthorizedError') {
        return c.json({
            success: false,
            error: 'Unauthorized',
        }, 401);
    }

    return c.json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(isDev && { stack: err.stack }),
    }, 500);
};

export const asyncHandler = (fn: Function) => {
    return async (c: Context, next: Next) => {
        try {
            await fn(c, next);
        } catch (error) {
            throw error;
        }
    };
};
