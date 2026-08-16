import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) throw new AppError('Email and password are required.', 400);
  if (password.length < 8) throw new AppError('Password must be at least 8 characters.', 400);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({ name, email, password });
  const token = signToken(user);

  res.status(201).json({ success: true, token, user: user.toSafeJSON() });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required.', 400);

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(user);
  res.json({ success: true, token, user: user.toSafeJSON() });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found.', 404);
  res.json({ success: true, user: user.toSafeJSON() });
});
