import { UnauthorizedError } from '../lib/errors.js';
import { verifyAccess } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken;

  if (!token) {
    return next(new UnauthorizedError('Not signed in'));
  }

  try {
    const payload = verifyAccess(token);
    req.userId = payload.sub;
    return next();
  } catch {
    return next(new UnauthorizedError('Session expired'));
  }
}
