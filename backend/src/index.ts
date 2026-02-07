import app from '@/app'

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const idleTimeoutEnv = Number(process.env.IDLE_TIMEOUT ?? 120);
const idleTimeout = Math.min(idleTimeoutEnv, 255);
const port = Number(process.env.PORT ?? 3000);

if (idleTimeoutEnv > 255) {
    console.warn(`IDLE_TIMEOUT (${idleTimeoutEnv}) exceeds maximum (255). Using 255 instead.`);
}

Bun.serve({
    fetch: app.fetch,
    port: port,
    idleTimeout: idleTimeout,
});

console.log(`Server running on host: ${host}, port: ${port}`);
console.log(`Idle timeout: ${idleTimeout} seconds`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
