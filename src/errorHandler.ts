import {
    Request as ExRequest,
    Response as ExResponse,
    NextFunction,
} from 'express';
import { logger } from './utils/logger';

export function errorHandler(
    err: Error,
    req: ExRequest,
    res: ExResponse,
    next: NextFunction
) {
    if (!err) {
        next(err);
    }
    logger.error(err.stack);
    res.status(500).send('Something went wrong');
}
