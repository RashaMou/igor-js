import winston from "winston";

let logger;

export function setupLogging() {
  logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, service }) => {
        return `${timestamp} [${service}] ${level}: ${message}`;
      }),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "igor.log" }),
    ],
  });
}

export function getLogger(name) {
  if (!logger) {
    setupLogging();
  }
  return logger.child({ service: name });
}
