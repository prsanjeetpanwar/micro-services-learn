import Joi from 'joi'


const validateRegistration=  (data)=>{
    const schema=Joi.object({
        userName:Joi.string().min(3).max(50).required(),
        email:Joi.string().email().required(),
        password:Joi.string().min(6).max(20).required()

    })

    return schema.validate(data)
}

const validateLogin=  (data)=>{
    const schema=Joi.object({
        email:Joi.string().email().required(),
        password:Joi.string().min(6).max(20).required()

    })

    return schema.validate(data)
}



export {validateRegistration,validateLogin}