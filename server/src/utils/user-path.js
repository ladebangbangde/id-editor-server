const crypto = require('crypto');
const appConfig = require('../config/app.config');

function resolveUserIdentityKey(user = {}) {
  if (user.unionid && String(user.unionid).trim()) return `unionid:${String(user.unionid).trim()}`;
  if (user.openid && String(user.openid).trim()) return `openid:${String(user.openid).trim()}`;
  if (user.accountId && String(user.accountId).trim()) return `account:${String(user.accountId).trim()}`;
  if (user.id != null) return `uid:${String(user.id)}`;
  return `mock:${appConfig.mockUserOpenid}`;
}

function buildUserPathSegment(user = {}) {
  const raw = resolveUserIdentityKey(user);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const hashLength = Number.isFinite(appConfig.userPathHashLength) && appConfig.userPathHashLength > 0
    ? Math.floor(appConfig.userPathHashLength)
    : 20;
  return hash.slice(0, hashLength);
}

module.exports = {
  resolveUserIdentityKey,
  buildUserPathSegment
};
