const { User } = require('../models');
const appConfig = require('../config/app.config');
const AppError = require('../utils/app-error');
const { verifyToken } = require('../utils/token-helper');

const PUBLIC_PATHS = new Set(['/auth/wx-login', '/auth/admin/login']);

function getBearerToken(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

async function attachMockUser(req) {
  let user = await User.findOne({ where: { openid: appConfig.mockUserOpenid } });
  if (!user) {
    user = await User.create({
      openid: appConfig.mockUserOpenid,
      nickname: appConfig.mockUserNickname,
      status: 1
    });
  }
  req.user = user;
}

module.exports = async (req, res, next) => {
  try {
    if (PUBLIC_PATHS.has(req.path)) {
      return next();
    }

    const token = getBearerToken(req);

    if (token) {
      const payload = await verifyToken(token);
      const user = await User.findOne({ where: { id: payload.userId, openid: payload.openid } });

      if (!user) {
        throw new AppError('用户不存在', 401, null, 9006);
      }

      req.user = user;
      return next();
    }

    if (appConfig.authMockMode) {
      await attachMockUser(req);
      return next();
    }

    throw new AppError('token 校验失败', 401, null, 9015);
  } catch (error) {
    next(error);
  }
};
