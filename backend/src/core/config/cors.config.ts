type Environment = 'development' | 'production' | 'test';

const allowedOrigins: Record<Environment, string[]> = {
    development: ['http://localhost:5173', 'http://localhost:5174'],
    production: [ '' ],
    test: ['http://localhost:3000'],
};

const env = (process.env.NODE_ENV as Environment) || 'development';

export const corsConfig = {
    origin: allowedOrigins[env],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
};
