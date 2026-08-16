import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export default function auth(req, res, next) {
  let token = req.query.token;
  if (!token) {
    const header = req.headers.authorization || '';
    const [scheme, credentials] = header.split(' ');
    if (scheme === 'Bearer') {
      token = credentials;
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
