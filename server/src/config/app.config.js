const path = require('path');

const SHARED_UPLOAD_ROOT = '/app/uploads';
const uploadDir = path.resolve(SHARED_UPLOAD_ROOT);
const authMockMode = process.env.AUTH_MOCK_MODE
  ? process.env.AUTH_MOCK_MODE === 'true'
  : (process.env.NODE_ENV || 'development') !== 'production';
const idEditorToolBaseUrl = process.env.ID_EDITOR_TOOL_BASE_URL || process.env.AI_SERVICE_BASE_URL || 'http://127.0.0.1:8666';
const idEditorToolPublicBaseUrl = process.env.ID_EDITOR_TOOL_PUBLIC_BASE_URL || process.env.AI_SERVICE_PUBLIC_BASE_URL || idEditorToolBaseUrl;

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || '/api',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '2h',
  wechatAppId: process.env.WECHAT_APPID || '',
  wechatSecret: process.env.WECHAT_SECRET || '',
  authMockMode,
  uploadDir,
  toolSharedUploadRoot: path.resolve(SHARED_UPLOAD_ROOT),
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024),
  mockUserOpenid: process.env.MOCK_USER_OPENID || 'mock_openid_1001',
  mockUserNickname: process.env.MOCK_USER_NICKNAME || '演示用户',
  idEditorToolBaseUrl,
  idEditorToolTimeout: Number(process.env.ID_EDITOR_TOOL_TIMEOUT || 30000),
  idEditorToolPublicBaseUrl,
  logLevel: process.env.LOG_LEVEL || 'info',
  fileRetentionOriginalHours: Number(process.env.FILE_RETENTION_ORIGINAL_HOURS || 24),
  fileRetentionResultHours: Number(process.env.FILE_RETENTION_RESULT_HOURS || 168),
  softDeletePhysicalDeleteDelayMinutes: Number(process.env.SOFT_DELETE_PHYSICAL_DELETE_DELAY_MINUTES || 10),
  cleanupCron: process.env.CLEANUP_CRON || '*/30 * * * *',
  userPathHashLength: Number(process.env.USER_PATH_HASH_LENGTH || 20)
};
