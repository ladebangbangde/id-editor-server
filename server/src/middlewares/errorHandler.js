const logger = require('../config/logger');
const { fail } = require('../utils/apiResponse');

module.exports = function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack
  });

  if (res.headersSent) {
    return next(err);
  }

  return fail(res, err.message || 'Internal server error', 500, 500);
};
