import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import postRoute from './routes/post.routes.js';
import logger from './utils/logger.js';
import {connectDB} from './db/db.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { StatusCodes } from 'http-status-codes';
import errorHandler from './middlewares/errorHandler.middleware.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    logger.info('Successfully connected to Redis');
});
connectDB();

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);
    next();
});

// Rate limiter middleware
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1,
});

const rateLimiterMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (error) {
        logger.warn(`⛔ Rate limit exceeded for IP ${req.ip}`);
        logger.error(`❌ Rate limiter error: ${error.message}`);
        res.status(StatusCodes.TOO_MANY_REQUESTS).json({
            success: false,
            message: "Too many requests. Please try again later.",
        });
    }
};

// IP-based rate limiting for sensitive endpoints
const SensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    // store: new RedisStore({
    //     sendCommand: (...args) => redisClient.sendCommand(args),
    // }),
});

app.use(rateLimiterMiddleware);

// Apply IP-based rate limiting to specific endpoints
app.use('/api/posts', SensitiveEndpointsLimiter, (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoute);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// redisClient.on('error', (err) => {
//     logger.error(`Redis connection error: ${err.message}`);
// });

// redisClient.on('reconnecting', () => {
//     logger.warn('Reconnecting to Redis...');
// });

// 

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
        message: error.message,
        stack: error.stack
    });
    process.exit(1);
});