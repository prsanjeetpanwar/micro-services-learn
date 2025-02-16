import mongoose from "mongoose";
import argon2 from "argon2";


const UserSchema =new  mongoose.Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
       
    },
    createdAt :{
        type:Date,
        default:Date.now
    },
   
}, {
    timestamps:true
})



UserSchema.pre("save", async function(next) {
    if (this.isModified('password')) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (err) {
            return next(err); // Pass the error correctly
        }
    }
    next(); // Ensure next() is called correctly
});
UserSchema.methods.comparePassword=async function(candidatePassword){
    try {
    return await argon2.verify(this.password, candidatePassword)
    }
    catch(err){
       throw err 
    }
}

UserSchema.index({userName:'text'})


const User = mongoose.model('User',UserSchema)
export default User
