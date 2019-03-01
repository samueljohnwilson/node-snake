const winston = require("winston");
const gameId = require("./index");

var options = {
  file: {
    level: "silly",
    filename: `./logs/${gameId}`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: "warn",
    handleExceptions: true,
    json: false,
    colorize: true
  }
};

// const logger = winston.createLogger({
//   level: process.env.LOG_LEVEL || "debug",
//   transports: [new winston.transports.Console(options.console)],
//   format: winston.format.combine(
//     winston.format.colorize({ all: true }),
//     winston.format.splat(),
//     winston.format.simple()
//   )
// });

module.exports = { logger };
