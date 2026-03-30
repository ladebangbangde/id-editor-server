const cron = require('node-cron');
const appConfig = require('../config/app.config');
const logger = require('../utils/logger');
const photoCleanupService = require('../services/photoCleanup.service');

function startCleanupJob() {
  const cronExpression = appConfig.cleanupCron;
  if (!cron.validate(cronExpression)) {
    logger.warn('photo cleanup cron is invalid, skip schedule', { cronExpression });
    return null;
  }

  logger.info('photo cleanup cron scheduled', { cronExpression });
  return cron.schedule(cronExpression, async () => {
    try {
      await photoCleanupService.runCleanup();
    } catch (error) {
      logger.error('photo cleanup cron failed', { message: error.message });
    }
  });
}

module.exports = {
  startCleanupJob
};
