const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const appConfig = require('../config/app.config');
const logger = require('../utils/logger');
const photoService = require('../modules/photo/photo.service');

function cleanupTempDir() {
  const tempDir = path.join(appConfig.uploadDir, 'temp');
  if (!fs.existsSync(tempDir)) return 0;

  let deleted = 0;
  for (const fileName of fs.readdirSync(tempDir)) {
    const filePath = path.join(tempDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    fs.unlinkSync(filePath);
    deleted += 1;
  }
  return deleted;
}

function startCleanupJob() {
  cron.schedule(appConfig.cleanupCron, async () => {
    try {
      const tempDeleted = cleanupTempDir();
      const photoCleanupSummary = await photoService.cleanupExpiredFiles();
      logger.info('cleanup job finished', {
        cleanupCron: appConfig.cleanupCron,
        tempDeleted,
        photoCleanupSummary
      });
    } catch (error) {
      logger.error('cleanup job failed', {
        message: error.message
      });
    }
  });
}

module.exports = {
  startCleanupJob
};
