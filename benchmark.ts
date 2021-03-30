import autocannon from 'autocannon';
import redis, { RedisClient } from 'redis';

let client: RedisClient;
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
                pipelining: 4,
                duration: 30,
            },
            (err, result) => {}
        );
        autocannon.track(instance, {
            renderProgressBar: true,
        });

        client.end();
    });
