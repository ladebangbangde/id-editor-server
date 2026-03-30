const crypto = require('crypto');
const path = require('path');
const appConfig = require('../config/app.config');

function normalizeLength(length) {
  const parsed = Number(length);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return appConfig.userPathHashLength;
  }
  return Math.floor(parsed);
}

function buildUserHash(openidOrUnionid, length = appConfig.userPathHashLength) {
  const base = String(openidOrUnionid || 'anonymous_user');
  const hash = crypto.createHash('sha256').update(base).digest('hex');
  return hash.slice(0, normalizeLength(length));
}

function buildUserImageStoragePath({ openid, unionid, createdAt = new Date(), imageId }) {
  const date = new Date(createdAt);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const identity = unionid || openid || 'anonymous_user';
  const hash = buildUserHash(identity, appConfig.userPathHashLength);
  const userDir = `u_${hash}`;
  const imageDir = `img_${imageId}`;
  const relativeBaseDir = path.join(year, month, userDir, imageDir);
  const baseDir = path.join(appConfig.uploadDir, relativeBaseDir);

  return {
    userHash: hash,
    userDir,
    imageDir,
    baseDir,
    originalPath: path.join(baseDir, 'original.jpg'),
    previewPath: path.join(baseDir, 'preview.jpg'),
    hdPath: path.join(baseDir, 'hd.jpg'),
    printPath: path.join(baseDir, 'print.jpg')
  };
}

module.exports = {
  buildUserHash,
  buildUserImageStoragePath
};
