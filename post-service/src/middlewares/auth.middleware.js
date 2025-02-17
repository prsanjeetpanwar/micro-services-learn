import logger from "../utils/logger.js";
import { StatusCodes } from 'http-status-codes';

export const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        logger.warn('Access attempted without authentication headers');
        return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized, please log in to continue' });
    }

   

    req.user = { userId };
    next();
};
