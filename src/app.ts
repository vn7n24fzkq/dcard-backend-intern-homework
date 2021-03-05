import express from 'express';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { initRedis } from './db/redis';

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
        console.log(`Server Port : ${PORT}`);
    });
}
