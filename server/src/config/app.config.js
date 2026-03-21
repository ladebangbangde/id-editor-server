const path = require('path');
module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || '/api',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'replace-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '2h',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024),
  mockUserOpenid: process.env.MOCK_USER_OPENID || 'mock_openid_1001',
  mockUserNickname: process.env.MOCK_USER_NICKNAME || '演示用户',
  idEditorToolBaseUrl: process.env.ID_EDITOR_TOOL_BASE_URL || 'http://127.0.0.1:8666',
  idEditorToolTimeout: Number(process.env.ID_EDITOR_TOOL_TIMEOUT || 30000),
  idEditorToolPublicBaseUrl: process.env.ID_EDITOR_TOOL_PUBLIC_BASE_URL || process.env.ID_EDITOR_TOOL_BASE_URL || 'http://127.0.0.1:8666'
};
