const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const appConfig = require('../config/app.config');
const { FOLDERS } = require('../constants/file');
const { buildUserPathSegment } = require('./user-path');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const normalizeSlashes = (value) => value.replace(/\\/g, '/');
const ensureUploadDirs = () => Object.values(FOLDERS).forEach((folder) => ensureDir(path.join(appConfig.uploadDir, folder)));
const buildFileName = (ext = '.jpg') => `${Date.now()}-${uuidv4()}${ext}`;
const relativeUploadPath = (folder, fileName) => `/uploads/${folder}/${fileName}`;
const absoluteUploadPath = (folder, fileName) => path.join(appConfig.uploadDir, folder, fileName);
const relativeUserUploadPath = (user, folder, fileName = '') => {
  const userSegment = buildUserPathSegment(user);
  const filePart = fileName ? `/${fileName}` : '';
  return `/uploads/users/${userSegment}/${folder}${filePart}`;
};
const absoluteUserUploadPath = (user, folder, fileName = '') => {
  const userSegment = buildUserPathSegment(user);
  return path.join(appConfig.uploadDir, 'users', userSegment, folder, fileName);
};
const toolSharedUploadPath = (folder, fileName) => normalizeSlashes(path.join(appConfig.toolSharedUploadRoot, folder, fileName));
const toToolSharedAbsolutePath = (absolutePath) => {
  if (!absolutePath) return null;
  const relativePath = normalizeSlashes(path.relative(appConfig.uploadDir, absolutePath));
  if (relativePath && !relativePath.startsWith('..')) {
    return normalizeSlashes(path.join(appConfig.toolSharedUploadRoot, relativePath));
  }
  return normalizeSlashes(absolutePath);
};
const resolveUploadRelativePathFromAbsolute = (absolutePath) => {
  if (!absolutePath) return null;
  const relativePath = normalizeSlashes(path.relative(appConfig.uploadDir, absolutePath));
  if (!relativePath || relativePath.startsWith('..')) return null;
  return `/uploads/${relativePath}`;
};
const toAbsoluteUploadPathFromUrl = (urlPath) => {
  if (!urlPath) return null;
  if (/^https?:\/\//i.test(urlPath)) {
    try {
      const parsed = new URL(urlPath);
      urlPath = parsed.pathname || '';
    } catch (_error) {
      return null;
    }
  }
  const normalized = String(urlPath).trim();
  if (!normalized.startsWith('/uploads/')) return null;
  return path.join(appConfig.uploadDir, normalized.replace(/^\/uploads\//, ''));
};

module.exports = {
  ensureDir,
  ensureUploadDirs,
  buildFileName,
  relativeUploadPath,
  absoluteUploadPath,
  relativeUserUploadPath,
  absoluteUserUploadPath,
  toolSharedUploadPath,
  toToolSharedAbsolutePath,
  resolveUploadRelativePathFromAbsolute,
  toAbsoluteUploadPathFromUrl
};
