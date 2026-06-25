import pino from 'pino';

// Define the transport for pretty logging in development
// In production, we just log structured JSON without the pino-pretty overhead
const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
        env: process.env.NODE_ENV,
    },
    ...(isDev && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname,env',
                translateTime: 'SYS:standard',
            }
        }
    })
});
