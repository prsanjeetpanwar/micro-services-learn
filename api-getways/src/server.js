import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import proxy from 'express-http-proxy';
import logger from '../src/utils/logger.js';
import errorHandler from '../src/middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: async (...args) => redisClient.call(...args),
    }),
});

app.use(rateLimiter);

const proxyOptions = {

    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');
    },

    proxyErrorHandler: (err, req, userRes) => {  
        logger.error(`Proxy error: ${err.message}`, { error: err });
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Internal Server Error',
                error: err.message
            })
        };
    }
};
app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info('Request headers:', req.headers);
    logger.info('Request body:', req.body || {});
    next();
});


app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Request received from identity service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

app.use(errorHandler)



app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`identity service  is running on port  ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Redis Url ${process.env.REDIS_URL}`);



});

