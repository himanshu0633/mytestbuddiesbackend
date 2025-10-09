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
    const newUser = new User({
      name,
      email,
      mobile,
      password,
      userType,
      utr,
      proofOfPayment: proofOfPayment ? proofOfPayment.path : null,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('Error during registration:', error); // Log error
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login function
export const loginUser = async (req, res) => {
  const { email, mobile, password } = req.body;

  console.log('Received login request with data:', req.body); // Log login data

  try {
    const user = await User.findOne({ $or: [{ email }, { mobile }] });

    if (!user || !(await user.comparePassword(password))) {
      console.log('Invalid credentials'); // Log invalid credentials
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error); // Log error
    res.status(500).json({ message: 'Server error during login' });
  }
};
