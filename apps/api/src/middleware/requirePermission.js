import { can } from '@team-hub/shared/permissions';
import { ForbiddenError } from '../lib/errors.js';

export function requirePermission(action) {
  return (req, res, next) => {
    if (!req.role) {
      return next(new ForbiddenError('No workspace role loaded'));
    }

    if (!can(req.role, action)) {
      return next(new ForbiddenError(`Missing permission: ${action}`));
    }

    return next();
  };
}
