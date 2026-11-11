const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, fullName: user.fullName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Email is already registered' });
    }

    const user = await User.create({ fullName, email, password, role });
    const token = generateToken(user);

    res.status(201).json({
      status: true,
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.status(200).json({
      status: true,
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};