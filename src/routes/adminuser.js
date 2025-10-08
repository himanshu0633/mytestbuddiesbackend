import express from 'express';
import { registerUser, loginUser } from '../Controller/userController.js'; 
const router = express.Router();

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

export default router; 
