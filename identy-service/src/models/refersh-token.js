import mongoose from 'mongoose'


const RefreshTokenSchema= new mongoose.Schema({
  token:{
    type:String,
    required:true,
    unique:true
  },
 user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
 },
 expireAt:{
 type :Date,
 required:true
 }
},{
    timestamps:true
})


RefreshTokenSchema.index({expireAt:1},{expireAfterSeconds:0})

const RefreshToken= mongoose.model('RefreshToken',RefreshTokenSchema)
export default RefreshToken