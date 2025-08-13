// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { signupSchema, validate } from '../middleware/validate.js';
import auth from '../middleware/auth.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';


cloudinary.config({
  cloud_name: 'dmifpzrrc',
  api_key: '252835291663747',
  api_secret: 'CycDSKjcfbdkwMOPJxVJFS2X4r8'
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed'))
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

  // cookie mode (recommended in production over HTTPS)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // or include token in JSON if you prefer bearer auth on the client
  // return res.json({ token, message: 'Login successful' });

  res.json({ message: 'Login successful' });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: 'avatars',
        resource_type: 'image',
        transformation: [{ width: 312, height: 312, crop: 'fill', gravity: 'face' }]
      });

      const current = await User.findById(req.userId).select('avatar.publicId');
      if (current?.avatar?.publicId) {
        try { await cloudinary.uploader.destroy(current.avatar.publicId); } catch {}
      }

      updates.avatar = {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        width: uploadRes.width,
        height: uploadRes.height,
        bytes: uploadRes.bytes,
        format: uploadRes.format
      };
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true })
      .select('-passwordHash');

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
