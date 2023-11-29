// logger.js
const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "combined.log"),
    }),
  ],
});

module.exports = logger;
