const appConfig = require('../config/app.config');
const { buildUserHash } = require('./userPath');

function getCurrentUserIdentity(req) {
  const user = req?.user || {};
  const openid = user.openid || appConfig.mockUserOpenid || null;
  const unionid = user.unionid || null;
  const userId = user.id || null;
  const hashSource = unionid || openid || `user_${userId || 'anonymous'}`;

  return {
    userId,
    openid,
    unionid,
    openidHash: buildUserHash(hashSource, appConfig.userPathHashLength)
  };
}

module.exports = {
  getCurrentUserIdentity
};
