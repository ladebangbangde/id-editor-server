const jwt = require('jsonwebtoken');
const appConfig = require('../config/app.config');
const AppError = require('./app-error');

const USER_TOKEN_TYPE = 'user';
const ADMIN_TOKEN_TYPE = 'admin';

function signUserToken(payload) {
  return jwt.sign({ ...payload, type: USER_TOKEN_TYPE }, appConfig.jwtSecret, { expiresIn: appConfig.jwtExpiresIn });
}

function signAdminToken(payload) {
  return jwt.sign({ ...payload, type: ADMIN_TOKEN_TYPE }, appConfig.jwtSecret, { expiresIn: appConfig.adminJwtExpiresIn });
}

function verifyToken(token, expectedType = USER_TOKEN_TYPE) {
  try {
    const payload = jwt.verify(token, appConfig.jwtSecret);

    if (expectedType && payload.type !== expectedType) {
      throw new AppError('token无效', 401, null, 9002);
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.name === 'TokenExpiredError') {
      throw new AppError('token已过期', 401, null, 9003);
    }

    throw new AppError('token无效', 401, null, 9002);
  }
}

module.exports = {
  USER_TOKEN_TYPE,
  ADMIN_TOKEN_TYPE,
  signUserToken,
  signAdminToken,
  verifyToken
};
