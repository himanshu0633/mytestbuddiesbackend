import User from '../models/user.js';
import jwt from 'jsonwebtoken';

// Register User
export const registerUser = async (req, res) => {
  const { name, email, mobile, password, userType, qrCode } = req.body;

  // Validate input fields
  if (!name || !password || (!email && !mobile) || !userType) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if email or mobile already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const newUser = new User({ name, email, mobile, password, userType, qrCode });
    await newUser.save();

    // Create JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, mobile, password } = req.body;

  try {
    // Find user by email or mobile
    const user = await User.findOne({ $or: [{ email }, { mobile }] });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
