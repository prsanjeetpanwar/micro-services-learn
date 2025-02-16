import generateToken from '../../utils/generateToken.js';
import logger from '../../utils/Logger.js';
import { validateRegistration, validateLogin } from '../../utils/Validation.js';
import RefreshToken from '../models/refersh-token.js';
import User from '../models/User.js';
import { StatusCodes } from 'http-status-codes';
import { metrics } from '../../utils/metrics.js';

export const registerUser = async (req, res) => {
    logger.info('User registration initiated...');
    const metricLabels = { method: 'POST', route: '/register', status: 'started' };
    metrics.requests.inc({ ...metricLabels, status: 'started' });
    try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn(`Validation Error: ${error.details[0].message}`);
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.details[0].message });
        }

        const { email, userName, password } = req.body;
        let userExists = await User.findOne({ $or: [{ email }, { userName }] });
        if (userExists) {
            logger.warn('User already exists');
            return res.status(StatusCodes.CONFLICT).json({ success: false, message: 'User already exists' });
        }

        const user = new User({ userName, email, password });
        await user.save();
        logger.info(`User registered successfully: ${user._id}`);
        console.log('Metric Labels:', metricLabels);
        metrics.registrations.inc({ ...metricLabels, status: 'success' });

        const { accessToken, refreshToken } = await generateToken(user);
        res.status(StatusCodes.CREATED).json({ success: true, message: 'User registered successfully', accessToken, refreshToken });
        
    } catch (err) {
        logger.error(`Registration failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
    }
};

export const loginUser = async (req, res) => {
    logger.info('User login initiated...');
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            logger.warn(`Validation Error: ${error.details[0].message}`);
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.details[0].message });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn('User not found');
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn('Invalid password');
            return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = await generateToken(user);
        res.status(StatusCodes.OK).json({ success: true, accessToken, refreshToken, userId: user._id });
    } catch (err) {
        logger.error(`Login failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
    }
};

export const userDetailsHandler=async (req,res)=>{
    logger.info('User details requested...');
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            logger.warn('User not found');
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User notfound' });
        }
        res.status(StatusCodes.OK).json({ success: true, user });
        } catch (err) {
        logger.error(`User details request failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
    }

}

export const getAllUserDetails=async (req,res)=>{
    logger.info('All user details requested...');
    try{
        const users = await User.find();
        res.status(StatusCodes.OK).json({ success: true, users });
        
    }
catch(err){
    logger.error(`All user details request failed: ${err.message}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
}
}

const isTokenExpired = (token) => new Date(token.expireAt) < new Date();

export const refreshTokenHandler = async (req, res) => {
    logger.info('Refresh token process initiated...');
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('Refresh token not provided');
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Refresh token not provided' });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken || isTokenExpired(storedToken)) {
            logger.warn('Invalid or expired refresh token');
            return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Refresh token expired or invalid' });
        }

        const user = await User.findById(storedToken.userId);
        if (!user) {
            logger.warn('User not found for refresh token');
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateToken(user);
        storedToken.token = newRefreshToken;
        storedToken.expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await storedToken.save();

        res.status(StatusCodes.OK).json({ success: true, accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        logger.error(`Refresh token process failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
    }
};


export const logoutUser = async (req, res) => {
    logger.info('Logout process initiated...');
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            logger.warn('Refresh token not provided');
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Refresh token not provided',
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken) {
            logger.warn('Invalid refresh token');
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid refresh token',
            });
        }

        await storedToken.deleteOne();

        logger.info('User logged out successfully');
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'User logged out successfully',
        });

    } catch (err) {
        logger.error(`Logout process failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};