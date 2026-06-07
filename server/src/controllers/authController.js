const User = require('../models/User');
const { signToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'שם, אימייל וסיסמה הם שדות חובה' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'האימייל כבר רשום במערכת' });
    }

    const user = new User({
      name,
      email,
      password,
      role: 'customer',
    });
    await user.save();

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'אימייל וסיסמה הם שדות חובה' });
    }

    const user = await User.findByCredentials(email, password);
    const token = signToken({ id: user._id, email: user.email, role: user.role });
    res.json({ token, user });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ message: 'פרטי התחברות שגויים' });
    }
    next(err);
  }
}

module.exports = { register, login };
