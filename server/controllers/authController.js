import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    codingProfiles: user.codingProfiles,
    placementScore: user.placementScore,
    isPremium: user.isPremium,
    token: generateToken(user._id)
  });
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    codingProfiles: user.codingProfiles,
    placementScore: user.placementScore,
    isPremium: user.isPremium,
    token: generateToken(user._id)
  });
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user);
};

// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  const { name, codingProfiles } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (codingProfiles) {
    user.codingProfiles = { ...user.codingProfiles, ...codingProfiles };
  }

  await user.save();
  res.json(user);
};
