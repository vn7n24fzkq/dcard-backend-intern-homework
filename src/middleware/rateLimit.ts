import { Request, Response, NextFunction } from 'express';

import { getRedisClient } from '../db/redis';

// redis store value range is 2^63-1 to -2^63
const REQUEST_QUOTA = 1000;
const REQUEST_QUOTA_REMAINING = REQUEST_QUOTA - 1; // We pre-minus 1 for first request
const RATE_LIMIT_RESET_TIME = 3600; // seconds

interface RateLimitInfo {
    remaining: number;
    resetTime: number;
}

function fixedWindowLimiter(
    ip: string,
    punishStrategy: boolean
): Promise<RateLimitInfo> {
    return new Promise<RateLimitInfo>((resolve, reject) => {
        const info: RateLimitInfo = {
            remaining: REQUEST_QUOTA_REMAINING,
            resetTime: RATE_LIMIT_RESET_TIME,
        };
        try {
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
                                // probably get error when client disconnect or value is limited
                                if (err) reject(err);
                                info.remaining =
                                    replies[0] >= 0 ? replies[0] : -1;
                                info.resetTime = replies[1];
                                if (punishStrategy && info.remaining < 0) {
                                    // If we use punish strategy and the ip doesn't have any remaing quota
                                    // We increase reset time to punish it
                                    getRedisClient().expire(
                                        ip,
                                        info.resetTime + 10
                                    );
                                    info.resetTime += 10;
                                    resolve(info);
                                } else {
                                    resolve(info);
                                }
                            });
                    }
                }
            );
        } catch (err) {
            // I'm too lazy to handle each error
            reject(err);
        }
    });
}

export function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    fixedWindowLimiter(req.ip, true)
        .then((rateLimitInfo) => {
            res.setHeader(
                'X-RateLimit-Limit',
                `${REQUEST_QUOTA},${REQUEST_QUOTA};window=${RATE_LIMIT_RESET_TIME};comment="fixed window"`
            );
            res.setHeader(
                'X-RateLimit-Remaining',
                rateLimitInfo.remaining >= 0 ? rateLimitInfo.remaining : 0
            );

            res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime);

            if (rateLimitInfo.remaining < 0) {
                return res.status(429).send('Too many request').end();
            }

            next();
        })
        .catch((_) => {
            return res.status(500).end();
        });
}
