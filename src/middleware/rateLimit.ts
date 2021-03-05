import { Request, Response, NextFunction } from 'express';

import { getRedisClient } from 'express';

const MAX_RATE_LIMIT = 999; // should be 1000, but when first request occurs it will be 999 (avoid server do unnecessary operation)
const HTTP_STATUS_TOO_MANY_REQUEST = 429;

// TODO we can use redis origin data and don't need to create a new object
interface RateLimitInfo {
    remaining: number;
    resetTime: number;
}

// TODO deal with ipv4 and ipv6 ip address
function updateRateLimitAndGet(ip: string): RateLimitInfo {
    //TODO implement
}

export function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const rateLimitInfo = updateRateLimitAndGet(req.ip);

    if (rateLimitInfo.remaining < 0) {
        res.status(HTTP_STATUS_TOO_MANY_REQUEST);
        return; // early return
    }

    res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime);
    next();
}
