import { ZodError } from 'zod';
import { BadRequestError } from '../lib/errors.js';

export function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      req.body = parsed.body ?? req.body;
      req.params = parsed.params ?? req.params;
      req.query = parsed.query ?? req.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new BadRequestError(
            'Validation failed',
            error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            }))
          )
        );
      }

      return next(error);
    }
  };
}
