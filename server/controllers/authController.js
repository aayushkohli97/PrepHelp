import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail, generateOTP } from '../services/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const OTP_EXPIRY_MINUTES = 10;

// Helper: hash OTP before storing
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

// Helper: compare OTP
const compareOTP = async (candidateOTP, hashedOTP) => {
  return bcrypt.compare(candidateOTP, hashedOTP);
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

  // Generate OTP for email verification
  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);

  const user = await User.create({
    name,
    email,
    password,
    isEmailVerified: false,
    emailVerificationOTP: hashedOtp,
    emailVerificationExpires: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  // Send verification email (non-blocking — don't fail registration if email fails)
  try {
    await sendVerificationEmail(email, otp);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: false,
    codingProfiles: user.codingProfiles,
    placementScore: user.placementScore,
    isPremium: user.isPremium,
    token: generateToken(user._id),
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

  // If email is not verified, resend OTP and tell the client
  if (!user.isEmailVerified) {
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    user.emailVerificationOTP = hashedOtp;
    user.emailVerificationExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(email, otp);
    } catch (err) {
      console.error('Failed to send verification email:', err.message);
    }

    return res.status(403).json({
      needsVerification: true,
      email: user.email,
      token: generateToken(user._id),
      message: 'Email not verified. A new OTP has been sent to your email.',
    });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    codingProfiles: user.codingProfiles,
    placementScore: user.placementScore,
    isPremium: user.isPremium,
    prepCoins: user.prepCoins,
    token: generateToken(user._id),
  });
};

// @route POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const user = await User.findOne({ email }).select('+emailVerificationOTP +emailVerificationExpires');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: 'Email is already verified' });
  }

  if (!user.emailVerificationOTP || !user.emailVerificationExpires) {
    return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
  }

  if (user.emailVerificationExpires < new Date()) {
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  const isValid = await compareOTP(otp, user.emailVerificationOTP);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
  }

  // Mark as verified, clear OTP fields
  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: true,
    codingProfiles: user.codingProfiles,
    placementScore: user.placementScore,
    isPremium: user.isPremium,
    prepCoins: user.prepCoins,
    token: generateToken(user._id),
  });
};

// @route POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: 'Email is already verified' });
  }

  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);
  user.emailVerificationOTP = hashedOtp;
  user.emailVerificationExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail(email, otp);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
    return res.status(500).json({ message: 'Failed to send email. Please try again.' });
  }

  res.json({ message: 'A new OTP has been sent to your email.' });
};

// @route POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether an email exists — return success anyway
    return res.json({ message: 'If that email exists, a reset code has been sent.' });
  }

  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);
  user.passwordResetOTP = hashedOtp;
  user.passwordResetExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetEmail(email, otp);
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
    return res.status(500).json({ message: 'Failed to send email. Please try again.' });
  }

  res.json({ message: 'If that email exists, a reset code has been sent.' });
};

// @route POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({ email }).select('+passwordResetOTP +passwordResetExpires +password');
  if (!user) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (!user.passwordResetOTP || !user.passwordResetExpires) {
    return res.status(400).json({ message: 'No reset request found. Please request a new code.' });
  }

  if (user.passwordResetExpires < new Date()) {
    return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
  }

  const isValid = await compareOTP(otp, user.passwordResetOTP);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  // Set new password and clear reset fields
  user.password = newPassword;
  user.passwordResetOTP = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successfully. You can now log in.' });
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

  // Only allow updating name (email is read-only)
  if (name !== undefined) user.name = name;
  if (codingProfiles) {
    user.codingProfiles = { ...user.codingProfiles, ...codingProfiles };
  }

  await user.save();
  res.json(user);
};
