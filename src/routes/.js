import express from 'express';

import { registerUser, loginUser } from '../Controller/userController'; 
const userRoutes = express.Router();

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

export default userRoutes;  // Using export default for ES modules
