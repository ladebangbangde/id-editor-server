const path = require('path');
const { Op } = require('sequelize');
const { PhotoTask } = require('../models');
const appConfig = require('../config/app.config');
const logger = require('../utils/logger');
const { safeDeleteFile } = require('../utils/fileCleanup');

function toLocalFilePath(urlOrPath) {
  if (!urlOrPath) return null;
  try {
    const parsed = new URL(urlOrPath);
    return parsed.pathname || null;
  } catch (_error) {
    return String(urlOrPath);
  }
}

function toAbsoluteUploadPath(urlOrPath) {
  const localPath = toLocalFilePath(urlOrPath);
  if (!localPath || !localPath.startsWith('/uploads/')) return null;
  const relativePath = localPath.replace(/^\/uploads\//, '');
  return path.join(appConfig.uploadDir, relativePath);
}

async function deleteFiles(filePaths, stats) {
  for (const filePath of filePaths.filter(Boolean)) {
    const result = await safeDeleteFile(filePath, appConfig.uploadDir);
    if (!result.success) {
      stats.failed += 1;
      logger.warn('photo cleanup delete file failed', { filePath, reason: result.reason });
    }
  }
}

async function cleanupSoftDeleted(now, stats) {
  const threshold = new Date(now.getTime() - appConfig.softDeletePhysicalDeleteDelayMinutes * 60 * 1000);
  const records = await PhotoTask.findAll({
    where: {
      deleted_at: { [Op.not]: null, [Op.lte]: threshold },
      physical_deleted_at: { [Op.is]: null }
    },
    limit: 200
  });

  stats.scanned += records.length;

  for (const record of records) {
    const filePaths = [record.source_url, record.preview_url, record.result_url, record.print_url]
      .map((item) => toAbsoluteUploadPath(item));
    await deleteFiles(filePaths, stats);

    await record.update({
      physical_deleted_at: now,
      source_url: null,
      preview_url: null,
      result_url: null,
      print_url: null,
      original_path: null,
      preview_path: null,
      hd_path: null,
      print_path: null
    });

    stats.softDeletePhysicalCleared += 1;
  }
}

async function cleanupExpiredOriginal(now, stats) {
  const threshold = new Date(now.getTime() - appConfig.fileRetentionOriginalHours * 60 * 60 * 1000);
  const records = await PhotoTask.findAll({
    where: {
      deleted_at: { [Op.is]: null },
      created_at: { [Op.lte]: threshold },
      source_url: { [Op.not]: null }
    },
    limit: 300
  });

  stats.scanned += records.length;

  for (const record of records) {
    const sourceFilePath = toAbsoluteUploadPath(record.source_url);
    if (!sourceFilePath) continue;
    const result = await safeDeleteFile(sourceFilePath, appConfig.uploadDir);
    if (!result.success) {
      stats.failed += 1;
      logger.warn('photo cleanup delete expired original failed', { taskId: record.task_id, reason: result.reason });
      continue;
    }

    await record.update({ source_url: null, original_path: null });
    if (result.existed) {
      stats.expiredOriginalDeleted += 1;
    }
  }
}

async function cleanupExpiredResult(now, stats) {
  const records = await PhotoTask.findAll({
    where: {
      deleted_at: { [Op.is]: null },
      retain_until: { [Op.not]: null, [Op.lte]: now },
      [Op.or]: [
        { preview_url: { [Op.not]: null } },
        { result_url: { [Op.not]: null } },
        { print_url: { [Op.not]: null } }
      ]
    },
    limit: 300
  });

  stats.scanned += records.length;

  for (const record of records) {
    await deleteFiles([
      toAbsoluteUploadPath(record.preview_url),
      toAbsoluteUploadPath(record.result_url),
      toAbsoluteUploadPath(record.print_url)
    ], stats);

    const payload = {
      preview_url: null,
      result_url: null,
      print_url: null,
      preview_path: null,
      hd_path: null,
      print_path: null
    };

    const originalExpired = record.created_at
      ? (new Date(record.created_at).getTime() + appConfig.fileRetentionOriginalHours * 60 * 60 * 1000 <= now.getTime())
      : false;

    if (originalExpired && record.source_url) {
      const sourceFilePath = toAbsoluteUploadPath(record.source_url);
      const sourceDeleteResult = await safeDeleteFile(sourceFilePath, appConfig.uploadDir);
      if (!sourceDeleteResult.success) {
        stats.failed += 1;
      } else {
        payload.source_url = null;
        payload.original_path = null;
        if (sourceDeleteResult.existed) {
          stats.expiredOriginalDeleted += 1;
        }
      }
    }

    await record.update(payload);
    stats.expiredResultDeleted += 1;
  }
}

async function runCleanup() {
  const now = new Date();
  const stats = {
    scanned: 0,
    softDeletePhysicalCleared: 0,
    expiredOriginalDeleted: 0,
    expiredResultDeleted: 0,
    failed: 0
  };

  await cleanupSoftDeleted(now, stats);
  await cleanupExpiredOriginal(now, stats);
  await cleanupExpiredResult(now, stats);

  logger.info('photo cleanup cycle completed', stats);
  return stats;
}

module.exports = {
  runCleanup,
  toAbsoluteUploadPath
};
