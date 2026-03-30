const photoRetentionService = require('./photoRetention.service');

async function runCleanup(options = {}) {
  return photoRetentionService.purgeExpiredPhotos(options);
}

module.exports = {
  runCleanup,
  toAbsoluteUploadPath: photoRetentionService.toAbsoluteUploadPath,
  collectFileCandidates: photoRetentionService.collectFileCandidates
};
