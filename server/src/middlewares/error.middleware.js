const { fail } = require('../utils/api-response');
module.exports = (err, req, res, next) => { fail(res, err.message || 'Internal Server Error', err.data || null, err.statusCode || 500); };
