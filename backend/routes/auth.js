// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { signupSchema, validate } from '../middleware/validate.js';
import auth from '../middleware/auth.js';
import multer from 'multer';
import sharp from 'sharp';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (/^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed')))
});

const router = express.Router();

router.post('/signup', validate(signupSchema), async (req, res) => {
  const { username, email, phone, password } = req.body;
  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email: email.toLowerCase(), phone, passwordHash });
  res.status(201).json({ id: user._id, username: user.username, email: user.email, phone: user.phone });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ message: 'Login successful' });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out' });
});

router.get('/me', auth, async (req, res) => {
  const me = await User.findById(req.userId).select('-passwordHash');
  if (!me) return res.status(404).json({ message: 'User not found' });
  res.json(me);
});

router.put('/me', auth, upload.single('files'), async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);

    if (req.file) {
      // Process avatar to 312x312 (cover) and encode as JPEG
      const processed = sharp(req.file.buffer).resize(312, 312, { fit: 'cover', position: 'center' }).jpeg({ quality: 90 });
      const buffer = await processed.toBuffer();
      const key = `avatars/${req.userId}_${Date.now()}.jpg`;

      // Delete previous avatar from S3 if we have a stored key
      const current = await User.findById(req.userId).select('avatar.key');
      if (current?.avatar?.key) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: current.avatar.key }));
        } catch (_) {
          // swallow deletion errors to avoid blocking profile update
        }
      }

      // Upload new avatar to S3
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        CacheControl: 'public, max-age=31536000, immutable'
      }));

      updates.avatar = {
        url: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        key,
        width: 312,
        height: 312,
        bytes: buffer.length,
        format: 'jpg'
      };
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true }).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `${field} already in use` });
    }
    res.status(400).json({ message: err.message || 'Update failed' });
  }
});

export default router;
