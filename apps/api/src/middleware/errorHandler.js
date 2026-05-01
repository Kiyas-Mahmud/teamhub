export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.status) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error(err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Internal server error',
    },
  });
}
