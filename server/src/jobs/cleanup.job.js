const cron = require('node-cron');
const appConfig = require('../config/app.config');
const logger = require('../utils/logger');
const photoCleanupService = require('../services/photoCleanup.service');

let cleanupRunning = false;

async function triggerCleanup(options = {}) {
  if (cleanupRunning) {
    logger.warn('cleanup skipped because previous cycle is still running');
    return { skipped: true, reason: 'running' };
  }

  cleanupRunning = true;
  try {
    return await photoCleanupService.runCleanup(options);
  } finally {
    cleanupRunning = false;
  }
}

function startCleanupJob() {
  const cronExpression = appConfig.cleanupCron;
  if (!cron.validate(cronExpression)) {
    logger.warn('photo cleanup cron is invalid, skip schedule', { cronExpression });
    return null;
  }

  logger.info('photo cleanup cron scheduled', { cronExpression });
  return cron.schedule(cronExpression, async () => {
    try {
      await triggerCleanup({ dryRun: appConfig.cleanupDryRun });
    } catch (error) {
      logger.error('photo cleanup cron failed', { message: error.message });
    }
  });
}

module.exports = {
  startCleanupJob,
  triggerCleanup
};
