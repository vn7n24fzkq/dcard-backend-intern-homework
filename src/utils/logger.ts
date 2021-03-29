import winston, { format } from 'winston';
const { timestamp, colorize } = format;

const specificLevels = format((info, opts: string[]) => {
    if (!opts.includes(info.level)) {
        return false;
    }
    return info;
});

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        timestamp(),
        winston.format.printf(
            (info) => `${info.timestamp}[${info.level}] ${info.message}`
        )
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                timestamp(),
                colorize({ all: true })
            ),
        }),
        new winston.transports.File({
            format: specificLevels(['error']),
            filename: 'logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({
            format: specificLevels(['http']),
            filename: 'logs/http.log',
            level: 'http',
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            level: 'verbose',
        }),
    ],
});
