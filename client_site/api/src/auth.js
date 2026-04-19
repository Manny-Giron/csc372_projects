import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const JWT_EXPIRES = '8h';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
