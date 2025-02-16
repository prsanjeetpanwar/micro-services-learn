import dotenv from 'dotenv';
import express from 'express';
import { createClient } from 'redis';
import { connectDB } from '../db/db.js';
import helmet from 'helmet';
import cors from 'cors';
import logger from '../utils/Logger.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import routes from '../src/routes/identitiy-service.route.js';
import errorHandler from '../middlewares/error-handler.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Initialize Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    logger.info('Successfully connected to Redis');
});

// Connect to Redis
await redisClient.connect();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "trusted-cdn.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        }
    }
}));
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info('Request headers:', req.headers);
    logger.info('Request body:', req.body || {});
    next();
});

// Rate limiter middleware
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 1, // per 1 second
});

const rateLimiterMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch {
        logger.warn(`Rate limit exceeded for IP ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Too many requests",
        });
    }
};

app.use(rateLimiterMiddleware);

// Sensitive endpoints rate limiter
const SensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
});

app.use('/api/auth/register', SensitiveEndpointsLimiter);

// Routes
app.use('/api/auth', routes);

// Error handler middleware (must be after routes)
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await redisClient.ping();
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { 
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
    });
});

// Start the server
startServer();