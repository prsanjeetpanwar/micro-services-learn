import express from 'express'
import { createPostHandler } from '../controllers/post.controllers.js'
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router=express.Router();

// router.use(authMiddleware) if have to apply to each route
router.post('/create-post',authMiddleware,createPostHandler);

export default router

