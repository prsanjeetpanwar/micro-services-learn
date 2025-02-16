import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import RefreshToken from '../src/models/refersh-token.js'

const generateToken= async (user)=>{
    const accessToken=jwt.sign({
        userId:user._id,
        username:user.userName,

    }, process.env.JWT_SECRET, {expiresIn:'15m'})


    const refreshToken=crypto.randomBytes(32).toString('hex')

    const expireAT=new Date()
    expireAT.setDate(expireAT.getDate()+7)
await RefreshToken.create({
    token:refreshToken,
    user:user._id,
    expireAt:expireAT

})
return {accessToken,refreshToken}
}

export default generateToken

