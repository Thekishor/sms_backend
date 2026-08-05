import winston from "winston";
import "winston-daily-rotate-file";

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
)

const logger = winston.createLogger({
    level: "debug",
    format: logFormat,
    transports: [
        new winston.transports.Console(),

        // error logs
        new winston.transports.DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            level: "error",
            maxFiles: "7d",
        }),


        // all logs
        new winston.transports.DailyRotateFile({
            filename: "logs/app-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "7d",
        })
    ]
});

export const logError = (message: string, err: unknown) => {
    if (err instanceof Error) {
        logger.error(message, {
            message: err.message,
            stack: err.stack,
        });
    } else {
        logger.error(message, {
            message: String(err),
        })
    }
}

export default logger;