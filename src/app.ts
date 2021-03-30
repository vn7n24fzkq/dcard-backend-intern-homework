import express from 'express';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { initRedis } from './db/redis';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { logger } from './utils/logger';
import { errorHandler } from './errorHandler';

// Initial redis first, then we start the server
initRedis(() => {
    startServer();
});

function startServer() {
    const app = express();
    const PORT = 8000;
    app.use(rateLimitMiddleware);
    app.use(loggerMiddleware);

    app.get('/', (req, res, next) => {
        res.send('Hello');
    });

    // We need register error handler after route setup
    app.use(errorHandler);

    app.listen(PORT, () => {
        logger.log({
            level: 'info',
            message: `Server ${process.env.RATE_STRATEGY} Port : ${PORT}`,
        });
    });
}
