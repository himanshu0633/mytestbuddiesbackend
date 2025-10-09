import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // Adjust the import path as needed

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('File upload destination:', 'uploads'); // Log upload destination
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    console.log('File name:', file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Log generated file name
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Define `upload`
const upload = multer({ storage: storage });

// Export `upload` as a named export
export { upload };

// Register user without validation
export const registerUser = async (req, res) => {
  const { name, email, mobile, password, userType, utr } = req.body;
  const proofOfPayment = req.file;

  // Log received data and file
  console.log('Received registration data:', req.body);
  console.log('Received file for proof of payment:', proofOfPayment ? proofOfPayment.path : 'No file uploaded');

  try {
    // Validation
    if (!email || !password || !mobile) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      mobile,
      password,
      userType,
      utr,
      proofOfPayment: proofOfPayment ? proofOfPayment.path : null,
    });

    // Save user to database
    await newUser.save();
    console.log('User saved successfully:', newUser);

    // Create JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Respond with success message
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('Error during registration:', error); // Log error details
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};


// Login function
export const loginUser = async (req, res) => {
  const { email, mobile, password } = req.body;

  // Log received login request
  console.log('Received login request with data:', req.body);

  try {
    // Find user by email or mobile
    const user = await User.findOne({ $or: [{ email }, { mobile }] });

    if (!user) {
      console.log('User not found for credentials:', { email, mobile }); // Log if user not found
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password validity
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      console.log('Invalid password for user:', { email, mobile }); // Log invalid password
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User logged in successfully:', user); // Log successful login

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with success message and token
    res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error); // Log error details
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};
