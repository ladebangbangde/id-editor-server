const AppError = require('./app-error');
function requireFields(body, fields) { for (const f of fields) if (body[f] === undefined || body[f] === null || body[f] === '') throw new AppError(`Missing required field: ${f}`, 400); }
module.exports = { requireFields };
