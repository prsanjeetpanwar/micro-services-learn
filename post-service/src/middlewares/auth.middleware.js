import logger from "../utils/logger";
import { StatusCodes } from 'http-status-codes';


export const authMiddleware = (req, res, next) => {
    const userId=req.header['x-user-id']

    if(!userId) {
        logger.warn('Access attempted without authentication headers');
        return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized please login to continue' });
    } 
req.user={userId};
next();

    
}