import jwt from 'jsonwebtoken';
import User from '../../../src/model/User.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'your_default_secret_here',
      { expiresIn: '7d' } // Token expires in 7 days
    );
    // Persist token on the user record (so it can be invalidated server-side if needed)
    try {
      user.token = token;
      await user.save();
    } catch (saveErr) {
      console.warn('Failed to save token to user record:', saveErr?.message || saveErr);
    }

    // Return success response with token
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Register user
 * POST /auth/register
 * Body: { name, email, password }
 * Returns: User info (without token, user should login separately)
 */
export const register = async (req, res) => {
  const { name, email, password } = req.body;
    console.log(req.body);
  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name: name || 'User',
      email,
      password
    });

    await user.save();

    // Generate token so user can be authenticated immediately after registration
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'your_default_secret_here',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Save the token on the user record
    try {
      user.token = token;
      await user.save();
    } catch (saveErr) {
      console.warn('Failed to save token to new user record:', saveErr?.message || saveErr);
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};
