// routes/auth.js
import { Router } from 'express';
import {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  getMe,
} from '../Controller/userController.js'; 
const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', getMe);

export default router;
