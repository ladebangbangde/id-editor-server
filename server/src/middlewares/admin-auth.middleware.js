const AppError = require('../utils/app-error');
module.exports = (req,res,next)=>{ if(!req.headers['x-admin-token']) throw new AppError('Admin auth required',401); next(); };
