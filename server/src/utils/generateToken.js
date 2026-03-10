import jwt from 'jsonwebtoken';

export function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}
