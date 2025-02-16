import express from 'express'
import { loginUser,registerUser,refreshTokenHandler,logoutUser ,getAllUserDetails,userDetailsHandler} from '../controllers/identitiy-contoller.js';

const router=express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshTokenHandler);
router.post('/logout', logoutUser);
router.get('/all-users', getAllUserDetails);
router.get('/:id', userDetailsHandler);



export default router

