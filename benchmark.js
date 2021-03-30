const autocannon = require('autocannon');
const redis = require('redis');

let client;
client = redis
    .createClient({
        host: '127.0.0.1',
        port: 6379,
    })
    .on('ready', () => {
        // we flush redis before start it
        client.flushall();

        const instance = autocannon(
            {
                url: 'http://127.0.0.1:8000',
                connections: 20,
                pipelining: 1,
                duration: 30,
                setupClient:
                    '/home/vn7n24fzkq/github/dcard-backend-intern-homework/benchmark-setup-client',
                workers: 8,
            },
            (err, result) => {}
        );
        autocannon.track(instance, {
            renderProgressBar: true,
        });

        client.end();
    });
