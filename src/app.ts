import express from 'express';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { initRedis } from './db/redis';
import { logger } from './utils/logger';

// Initial redis first, then we start the server
initRedis(() => {
    startServer();
});

function startServer() {
    const app = express();
    const PORT = 8000;
    app.use(rateLimitMiddleware);

    app.get('/', (req, res) => res.send('Hello'));

    app.listen(PORT, () => {
        logger.log({
            level: 'info',
            message: `Server ${process.env.RATE_STRATEGY} Port : ${PORT}`,
        });
    });
}
