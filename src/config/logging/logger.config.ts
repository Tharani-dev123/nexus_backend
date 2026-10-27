import winston from "winston";
import LOGGING_CONFIG from "./index.config.js";
import BETTERSTACK_LOG_TRANSPORT from "./betterStackLogger.config.js";

const { colorize, combine, errors, printf, json, timestamp } = winston.format;
const { Console } = winston.transports;

const LOG_TRANSPORTS = [];

const CONSOLE_TRANSPORT = new Console({
  level: "debug",
  format: combine(
    colorize(),
    printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`,
    ),
  ),
});

if (LOGGING_CONFIG.CONSOLE_LOGGING) LOG_TRANSPORTS.push(CONSOLE_TRANSPORT);

if (LOGGING_CONFIG.BETTERSTACK_LOG_PUSH)
  LOG_TRANSPORTS.push(BETTERSTACK_LOG_TRANSPORT);

const logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    json(),
  ),
  transports: LOG_TRANSPORTS,
});

export default logger;
