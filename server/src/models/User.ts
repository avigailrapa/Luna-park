import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { AppError } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
}

interface IUserModel extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.statics.findByCredentials = async function (email: string, password: string) {
  const user = await this.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('פרטי התחברות שגויים') as AppError;
    error.statusCode = 401;
    throw error;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const error = new Error('פרטי התחברות שגויים') as AppError;
    error.statusCode = 401;
    throw error;
  }
  return user;
};

export default mongoose.model<IUser, IUserModel>('User', userSchema);
