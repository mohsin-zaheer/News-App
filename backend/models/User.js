// models/User.js
import mongoose from 'mongoose';

const avatarSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  width: Number,
  height: Number,
  bytes: Number,
  format: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  avatar: avatarSchema
}, { timestamps: true });

export default mongoose.model('User', userSchema);
