import redis, { RedisClient } from 'redis';

let client: RedisClient;

export function initRedis(callback: () => void) {
    client = redis.createClient({
        host: '127.0.0.1',
        port: 6379,
    });
    client.on('error', (error) => {
        console.error(error);
    });
    client.on('ready', () => {
        callback();
    });
}

export function getRedisClient(): RedisClient {
    if (client === null) throw new Error('You need initial redis client first');
    return client;
}
