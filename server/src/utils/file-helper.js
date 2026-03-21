const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const appConfig = require('../config/app.config');
const { FOLDERS } = require('../constants/file');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const normalizeSlashes = (value) => value.replace(/\\/g, '/');
const ensureUploadDirs = () => Object.values(FOLDERS).forEach((folder) => ensureDir(path.join(appConfig.uploadDir, folder)));
const buildFileName = (ext = '.jpg') => `${Date.now()}-${uuidv4()}${ext}`;
const relativeUploadPath = (folder, fileName) => `/uploads/${folder}/${fileName}`;
const absoluteUploadPath = (folder, fileName) => path.join(appConfig.uploadDir, folder, fileName);
const toolSharedUploadPath = (folder, fileName) => normalizeSlashes(path.join(appConfig.toolSharedUploadRoot, folder, fileName));
const toToolSharedAbsolutePath = (absolutePath) => {
  if (!absolutePath) return null;
  const relativePath = normalizeSlashes(path.relative(appConfig.uploadDir, absolutePath));
  if (relativePath && !relativePath.startsWith('..')) {
    return normalizeSlashes(path.join(appConfig.toolSharedUploadRoot, relativePath));
  }
  return normalizeSlashes(absolutePath);
};

module.exports = {
  ensureDir,
  ensureUploadDirs,
  buildFileName,
  relativeUploadPath,
  absoluteUploadPath,
  toolSharedUploadPath,
  toToolSharedAbsolutePath
};
