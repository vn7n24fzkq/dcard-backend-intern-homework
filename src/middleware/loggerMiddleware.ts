import morgan, { StreamOptions } from 'morgan';
import { logger } from '../utils/logger';

const stream: StreamOptions = {
    write: (message) =>
        logger.http(message.substring(0, message.lastIndexOf('\n'))),
};

export const loggerMiddleware = morgan(
    ':remote-addr :method :url :status :res[content-length] - :response-time ms',
    { stream }
);
