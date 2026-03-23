const { fail } = require('../utils/api-response');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error('request failed', {
    path: req.originalUrl,
    method: req.method,
    statusCode: err.statusCode || 500,
    businessCode: err.businessCode || null,
    message: err.message || 'Internal Server Error',
    data: err.data || null
  });

  return fail(
    res,
    err.message || 'Internal Server Error',
    err.data || null,
    err.statusCode || 500,
    err.businessCode || null
  );
};
