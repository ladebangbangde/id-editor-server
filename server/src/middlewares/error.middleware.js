const { fail } = require('../utils/api-response');

module.exports = (err, req, res, next) => {
  return fail(
    res,
    err.message || 'Internal Server Error',
    err.data || null,
    err.statusCode || 500,
    err.businessCode || null
  );
};
