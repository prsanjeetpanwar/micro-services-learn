import Post from '../models/post.model.js';
import logger from '../utils/logger.js'
import { StatusCodes } from 'http-status-codes';




export const createPostHandler=async (req,res)=>{
    logger.info('createPostHandler is initiated....')
    try{
        const {content,mediaIds}=req.body;
        const NewPost= new Post({
            user:req.user.userId,
            content,
            mediaIds:mediaIds || []
        })

        await NewPost.save();
        logger.info('Post created successfully')
        res.status(StatusCodes.CREATED).json({success:true,message:'Post created successfully',data:NewPost})
 }
    catch(err){
        logger.error(`createPostHandler request failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });

    } 
}


export const getAllPostHandler=async (req,res)=>{
    logger.info('getAllPostHandler is initiated....')
    try {

    }
    catch(err){
        logger.error(`getAllPostHandler request failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });

    }
}


export const deletePostHandler=async (req,res)=>{
    logger.info('deletePostHandler is initiated....')
    try{

    }
    catch(err){
        logger.error(`deletePostHandler request failed: ${err.message}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error' });
    }
}