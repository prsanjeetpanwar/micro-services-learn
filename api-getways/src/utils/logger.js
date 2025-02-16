import winston, { createLogger } from "winston";

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
  ),
  defaultMeta: { service: "api-gateway" },
  transports: [
      new winston.transports.Console({
          format: winston.format.combine( // ✅ Fix: use `winston.format.combine`
              winston.format.colorize(),
              winston.format.simple()
          ),
      }),
      new winston.transports.File({ filename: "error.log", level: "error" }), // ✅ Fix: `fileName` → `filename`
      new winston.transports.File({ filename: "combine.log" }) // ✅ Fix: `fileName` → `filename`
  ],
});

export default logger
