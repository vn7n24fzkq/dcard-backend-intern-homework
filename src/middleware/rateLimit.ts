import { Request, Response, NextFunction } from 'express';

import { getRedisClient } from '../db/redis';

// redis store value range is 2^63-1 to -2^63
const REQUEST_QUOTA = 1000;
const RATE_LIMIT_RESET_TIME = 3600; // seconds

interface RateLimitInfo {
    limit?: string;
    remaining: number; // -1 means rate-limit was limited
    resetTime?: number;
}
function slidingWindowLimiter(ip: string): Promise<RateLimitInfo> {
    function processRateLimit(
        resolve: (value: RateLimitInfo) => void,
        info: RateLimitInfo,
        remaining: number
    ) {
        info.limit = `${REQUEST_QUOTA};window=${RATE_LIMIT_RESET_TIME};comment="sliding window"`;
        info.remaining = remaining;
        resolve(info);
    }
    return new Promise<RateLimitInfo>((resolve, reject) => {
        const info: RateLimitInfo = {
            remaining: REQUEST_QUOTA,
        };
        const currentTimestamp = Date.now();
        const startTimestamp = currentTimestamp - RATE_LIMIT_RESET_TIME * 1000;
        getRedisClient()
            .multi()
            .zremrangebyscore(ip, '-inf', startTimestamp)
            .zcard(ip)
            .expire(ip, RATE_LIMIT_RESET_TIME)
            .exec((err, replies: number[]) => {
                if (err) reject(err);
                const remaining = REQUEST_QUOTA - replies[1] - 1; // we minus 1 for current request
                if (remaining >= 0) {
                    getRedisClient()
                        .multi()
                        .zadd(
                            ip,
                            'NX',
                            currentTimestamp,
                            `${currentTimestamp + Math.random()}` // make member unique
                        )
                        .exec((err, replies: number[]) => {
                            if (err) reject(err);
                            processRateLimit(resolve, info, remaining);
                        });
                } else {
                    processRateLimit(resolve, info, -1);
                }
            });
    });
}

function fixedWindowLimiter(ip: string): Promise<RateLimitInfo> {
    return new Promise<RateLimitInfo>((resolve, reject) => {
        const info: RateLimitInfo = {
            remaining: REQUEST_QUOTA,
        };
        getRedisClient()
            .multi()
            .set(ip, `${REQUEST_QUOTA}`, 'EX', RATE_LIMIT_RESET_TIME, 'NX')
            .decr(ip)
            .ttl(ip)
            .exec((err, replies: number[]) => {
                if (err) reject(err);
                info.limit = `${REQUEST_QUOTA};window=${RATE_LIMIT_RESET_TIME};comment="fixed window"`;
                info.remaining = replies[1];
                info.resetTime = replies[2];
                resolve(info);
            });
    });
}

function setRateLimitInfoToHeader(
    info: RateLimitInfo,
    res: Response
): Response {
    res.setHeader(
        'X-RateLimit-Remaining',
        info.remaining >= 0 ? info.remaining : 0
    );
    if (info.limit !== undefined) {
        res.setHeader('X-RateLimit-Limit', info.limit);
    }
    if (info.resetTime !== undefined) {
        res.setHeader('X-RateLimit-Reset', info.resetTime);
    }
    if (info.remaining < 0) {
        return res.status(429).send('Too many request');
    }
    return res;
}

export function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (process.env.RATE_STRATEGY === 'fixed-window') {
        fixedWindowLimiter(req.ip)
            .then((rateLimitInfo) => {
                setRateLimitInfoToHeader(rateLimitInfo, res);
                if (!res.writableEnded) {
                    next();
                }
            })
            .catch((_) => {
                return res.status(500).end();
            });
    } else if (process.env.RATE_STRATEGY === 'sliding-window') {
        slidingWindowLimiter(req.ip)
            .then((rateLimitInfo) => {
                setRateLimitInfoToHeader(rateLimitInfo, res);
                if (!res.writableEnded) {
                    next();
                }
            })
            .catch((_) => {
                return res.status(500).end();
            });
    }
}
