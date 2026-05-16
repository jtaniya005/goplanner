import jwt from 'jsonwebtoken';

// Middleware to require a valid JWT in the Authorization header
export default function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return res.status(401).json({ success: false, message: 'No authorization header' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, message: 'Invalid authorization format' });
    }

    const token = parts[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token missing' });

    const secret = process.env.JWT_SECRET || 'your_default_secret_here';
    const payload = jwt.verify(token, secret);

    // Attach user info to request for downstream handlers
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name
    };

    return next();
  } catch (err) {
    console.error('Auth middleware error:', err?.message || err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
