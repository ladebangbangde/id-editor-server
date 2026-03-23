const jwt = require('jsonwebtoken');
const appConfig = require('../config/app.config');
const runtimeConfigService = require('../services/runtime-config.service');
const AppError = require('./app-error');

const USER_TOKEN_TYPE = 'user';
const ADMIN_TOKEN_TYPE = 'admin';

async function signToken(payload, expectedType, expiresIn) {
  const secret = await runtimeConfigService.getJwtSecret();

  try {
    return jwt.sign({ ...payload, type: expectedType }, secret, { expiresIn });
  } catch (_error) {
    throw new AppError('JWT签发失败', 500, null, 9011);
  }
}

async function signUserToken(payload) {
  return signToken(payload, USER_TOKEN_TYPE, appConfig.jwtExpiresIn);
}

async function signAdminToken(payload) {
  return signToken(payload, ADMIN_TOKEN_TYPE, appConfig.adminJwtExpiresIn);
}

async function verifyToken(token, expectedType = USER_TOKEN_TYPE) {
  const secret = await runtimeConfigService.getJwtSecret();

  try {
    const payload = jwt.verify(token, secret);

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

    throw new AppError('token无效', 401, null, 9012);
  }
}

module.exports = {
  USER_TOKEN_TYPE,
  ADMIN_TOKEN_TYPE,
  signUserToken,
  signAdminToken,
  verifyToken
};
