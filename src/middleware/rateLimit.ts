import { Request, Response, NextFunction } from 'express';

import { getRedisClient } from '../db/redis';

const MAX_RATE_LIMIT_REMAINING = 999; // redis store value range is 2^63-1 to -2^63
const RATE_LIMIT_RESET_TIME = 3600; // seconds

// TODO we can use redis origin data and don't need to create a new object
interface RateLimitInfo {
    remaining: number;
    resetTime: number;
}

// TODO deal with ipv4 and ipv6 ip address
function updateRateLimitAndGet(ip: string): Promise<RateLimitInfo> {
    return new Promise<RateLimitInfo>((resolve, reject) => {
        let client = getRedisClient();
        const info: RateLimitInfo = {
            remaining: MAX_RATE_LIMIT_REMAINING,
            resetTime: RATE_LIMIT_RESET_TIME,
        };
        client.set(
            ip,
            String(info.remaining),
            'EX',
            info.resetTime,
            'NX',
            (err, reply: 'OK' | undefined) => {
                // OK => first time set
                if (err) reject(err);
                if (reply) {
                    // If ip doesn't exist, we return the info after first time set
                    resolve(info);
                } else {
                    // If ip does exist, we decr the value and get reset time
                    // Avoid do incr when set key at first time
                    client.decr(ip, (err, reply: number) => {
                        if (err) reject(err);
                        info.remaining = reply >= 0 ? reply : 0;
                        client.ttl(ip, (err, reply: number) => {
                            if (err) reject(err);
                            info.resetTime = reply;
                            resolve(info);
                        });
                    });
                }
            }
        );
    });
}

export async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const rateLimitInfo = await updateRateLimitAndGet(req.ip);

    res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime);

    if (rateLimitInfo.remaining <= 0) {
        return res.status(429).end(); // too many request
    }

    next();
}
