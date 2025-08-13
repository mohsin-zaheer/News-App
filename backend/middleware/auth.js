// src/middleware/auth.js
import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const bearer = req.header('Authorization');
  const token =
    req.cookies?.token ||
    (bearer && bearer.startsWith('Bearer ') ? bearer.slice(7) : null);

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // support either { sub } or { id }
    req.userId = payload.sub || payload.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
