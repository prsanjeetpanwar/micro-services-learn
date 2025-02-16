import mongoose from 'mongoose'
import logger from '../utils/logger.js'


export const connectDB=async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL)

        logger.info('MongoDB Connected')
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`)

    }
    catch(err){
        console.error(err)

    }
}