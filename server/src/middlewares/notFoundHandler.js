const { fail } = require('../utils/apiResponse');

module.exports = function notFoundHandler(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 404);
};
