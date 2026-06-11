import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import { signToken } from '../utils/jwt';
import type { AppError } from '../types';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'שם, אימייל וסיסמה הם שדות חובה' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ message: 'האימייל כבר רשום במערכת' });
      return;
    }

    const user = new User({
      name,
      email,
      password,
      role: 'customer',
    });
    await user.save();

    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'אימייל וסיסמה הם שדות חובה' });
      return;
    }

    const user = await User.findByCredentials(email, password);
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
    res.json({ token, user });
  } catch (err) {
    const error = err as AppError;
    if (error.statusCode === 401) {
      res.status(401).json({ message: 'פרטי התחברות שגויים' });
      return;
    }
    next(err);
  }
}
