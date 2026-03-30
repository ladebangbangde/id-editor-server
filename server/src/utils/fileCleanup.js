const fs = require('fs');
const path = require('path');

function normalizeAbsolute(target) {
  return path.resolve(target || '');
}

async function safeDeleteFile(filePath, uploadsRoot) {
  if (!filePath) {
    return { success: true, existed: false, reason: 'empty_path' };
  }

  const normalizedRoot = normalizeAbsolute(uploadsRoot);
  const normalizedTarget = normalizeAbsolute(filePath);
  const relative = path.relative(normalizedRoot, normalizedTarget);

  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return { success: false, existed: false, reason: 'path_outside_uploads_root' };
  }

  try {
    await fs.promises.access(normalizedTarget, fs.constants.F_OK);
  } catch (_error) {
    return { success: true, existed: false, reason: null };
  }

  try {
    await fs.promises.unlink(normalizedTarget);
    return { success: true, existed: true, reason: null };
  } catch (error) {
    return { success: false, existed: true, reason: error.message || 'unlink_failed' };
  }
}

module.exports = {
  safeDeleteFile
};
