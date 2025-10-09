import express from 'express';
import { registerUser, loginUser, upload } from '../Controller/userController.js'; // Corrected import

const router = express.Router();

// Register route with file upload
router.post('/register', upload.single('proofOfPayment'), (req, res, next) => {
  console.log('Received Registration Request');
  console.log('Form Data:', req.body); // Logs the form data
  console.log('File:', req.file); // Logs the uploaded file info

  // Pass to the registerUser controller after logging the request
  registerUser(req, res, next);
});

// Login route
router.post('/login', (req, res) => {
  console.log('Received Login Request');
  console.log('Login Data:', req.body); // Logs the login data
  loginUser(req, res);
});

export default router;
