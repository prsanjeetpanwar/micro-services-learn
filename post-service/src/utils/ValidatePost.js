
import Joi from 'joi'
import PostSchema from '../models/post.model.js'
export const ValidatePost = (req, res, next) => {
    const postSchema = Joi.object({
        content: Joi.string().min(1).required(),
        mediaIds: Joi.array().items(Joi.string().uuid()).optional(), 
    });

    const { error } = postSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    next();
};