const multer = require('multer');
const path = require('path');
const appConfig = require('../config/app.config');
const AppError = require('../utils/app-error');
const { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FOLDERS } = require('../constants/file');
const { buildFileName, absoluteUploadPath, ensureUploadDirs } = require('../utils/file-helper');

ensureUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, absoluteUploadPath(FOLDERS.ORIGINAL, '')),
  filename: (req, file, cb) => cb(null, buildFileName(path.extname(file.originalname).toLowerCase()))
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) return cb(null, true);
  return cb(new AppError('文件不是合法图片', 400, null, 1002));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: appConfig.maxFileSize } });
