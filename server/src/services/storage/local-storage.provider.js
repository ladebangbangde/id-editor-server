const fs = require('fs');
const { toAbsoluteUploadPathFromUrl } = require('../../utils/file-helper');

function safeUnlinkSync(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

module.exports = {
  type: 'local',

  deleteByUrl(url) {
    const localPath = toAbsoluteUploadPathFromUrl(url);
    if (!localPath) return { deleted: false, reason: 'not-local-upload-url' };

    const deleted = safeUnlinkSync(localPath);
    return {
      deleted,
      reason: deleted ? null : 'file-not-found',
      localPath
    };
  }
};
