import logger from "../utils/logger.js";
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

export const ValidateToken = (req, res, next) => {
    // Ensure JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET is not defined in environment variables');
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Server configuration error',
        });
    }

    // Extract token from Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    logger.info(`Auth Header: ${authHeader}`);

    // Check if token is missing
    if (!token) {
        logger.warn('Access attempted without authentication headers');
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Access denied. No token provided.',
        });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                logger.warn('Access attempted with expired token');
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: 'Access denied. Token has expired.',
                });
            } else if (err.name === 'JsonWebTokenError') {
                logger.warn('Access attempted with invalid token');
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: 'Access denied. Invalid token.',
                });
            } else {
                logger.error('Error verifying token:', err);
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: 'Access denied. Token verification failed.',
                });
            }
        }

        req.user = user;
        logger.info(`Token validated for user: ${user.userId || user.id}`);
        next();
    });
};