const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateTokens = (id) => ({
  accessToken: jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
});

const setCookies = (res, accessToken, refreshToken) => {
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
  res.cookie('accessToken', accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...opts, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    setCookies(res, accessToken, refreshToken);
    res.status(201).json({
      success: true, message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency, theme: user.theme },
      accessToken
    });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    setCookies(res, accessToken, refreshToken);
    res.json({
      success: true, message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency, theme: user.theme },
      accessToken
    });
  } catch (error) { next(error); }
};

exports.logout = async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, currency, theme, monthlyIncomeGoal, monthlySavingsGoal } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, currency, theme, monthlyIncomeGoal, monthlySavingsGoal },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token)
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    setCookies(res, accessToken, refreshToken);
    res.json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token expired, please login again' });
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'No user with that email' });
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Finance Dashboard',
      html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:20px;background:#0f172a;color:#fff;border-radius:12px">
        <h2 style="color:#6366f1">Password Reset</h2>
        <p>Click the link below to reset your password (expires in 10 minutes):</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none">Reset Password</a>
      </div>`
    });
    res.json({ success: true, message: 'Reset email sent' });
  } catch (error) { next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) { next(error); }
};
