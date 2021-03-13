import winston, { format } from 'winston';
const { combine, timestamp, label, prettyPrint } = format;

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(timestamp(), prettyPrint()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'log/error.log',
            level: 'error',
        }),
        new winston.transports.File({ filename: 'log/combined.log' }),
    ],
});
