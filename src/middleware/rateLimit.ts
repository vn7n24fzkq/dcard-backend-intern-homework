import { Request, Response, NextFunction } from 'express';

import { getRedisClient } from '../db/redis';

const MAX_RATE_LIMIT_REMAINING = 1000; // redis store value range is 2^63-1 to -2^63
const RATE_LIMIT_RESET_TIME = 3600; // seconds

interface RateLimitInfo {
    remaining: number;
    resetTime: number;
}

function fixedWindowLimiter(ip: string): Promise<RateLimitInfo> {
    return new Promise<RateLimitInfo>((resolve, reject) => {
        const info: RateLimitInfo = {
            remaining: MAX_RATE_LIMIT_REMAINING,
            resetTime: RATE_LIMIT_RESET_TIME,
        };
        getRedisClient().set(
            ip,
            `${info.remaining}`,
            'EX',
            info.resetTime,
            'NX',
            (err, reply: 'OK' | undefined) => {
                if (err) reject(err);
                // OK => first time set
                if (reply) {
                    // If ip doesn't exist, we return the info after first time set
                    resolve(info);
                } else {
                    // If ip does exist, we decr the value and get reset time
                    // Avoid do decr when set key at first time
                    getRedisClient()
                        .multi()
                        .decr(ip)
                        .ttl(ip)
                        .exec((err, replies: number[]) => {
                            if (err) reject(err); // probably client disconnect or expired
                            info.remaining = replies[0] >= 0 ? replies[0] : 0;
                            info.resetTime = replies[1];
                            resolve(info);
                        });
                }
            }
        );
    });
}

export function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    fixedWindowLimiter(req.ip).then((rateLimitInfo) => {
        res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime);

        if (rateLimitInfo.remaining <= 0) {
            return res.status(429).send('Too many request').end();
        }

        next();
    });
}
