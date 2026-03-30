const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { PhotoTask } = require('../models');
const appConfig = require('../config/app.config');
const logger = require('../utils/logger');
const { safeDeleteFile } = require('../utils/fileCleanup');

const CLEANUP_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  PARTIAL_FAILED: 'partial_failed',
  FAILED: 'failed',
  ORPHANED: 'orphaned'
};

function parseMaybeUrl(urlOrPath) {
  if (!urlOrPath) return null;
  try {
    const parsed = new URL(urlOrPath);
    return parsed.pathname || null;
  } catch (_error) {
    return String(urlOrPath);
  }
}

function toAbsoluteUploadPath(urlOrPath) {
  const localPath = parseMaybeUrl(urlOrPath);
  if (!localPath) return null;

  const normalized = localPath.startsWith('/') ? localPath : `/${localPath}`;
  if (!normalized.startsWith('/uploads/')) return null;

  const relativePath = normalized.replace(/^\/uploads\//, '');
  if (!relativePath) return null;
  return path.resolve(appConfig.uploadDir, relativePath);
}

function dedupe(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function collectFileCandidates(photoTask) {
  const candidates = dedupe([
    toAbsoluteUploadPath(photoTask.source_url),
    toAbsoluteUploadPath(photoTask.original_url),
    toAbsoluteUploadPath(photoTask.original_path),
    toAbsoluteUploadPath(photoTask.preview_url),
    toAbsoluteUploadPath(photoTask.preview_path),
    toAbsoluteUploadPath(photoTask.result_url),
    toAbsoluteUploadPath(photoTask.hd_url),
    toAbsoluteUploadPath(photoTask.hd_path),
    toAbsoluteUploadPath(photoTask.print_url),
    toAbsoluteUploadPath(photoTask.print_path)
  ]);

  return candidates;
}

async function deletePhysicalFiles(paths, stats = null) {
  const result = {
    successCount: 0,
    skippedCount: 0,
    failedCount: 0,
    deletedPaths: [],
    failedPaths: []
  };

  for (const filePath of dedupe(paths)) {
    if (!filePath) {
      result.skippedCount += 1;
      if (stats) stats.skipped += 1;
      continue;
    }

    const deleteResult = await safeDeleteFile(filePath, appConfig.uploadDir);
    if (!deleteResult.success) {
      result.failedCount += 1;
      result.failedPaths.push({ filePath, reason: deleteResult.reason || 'unknown' });
      if (stats) stats.failed += 1;
      logger.warn('cleanup delete file failed', { filePath, reason: deleteResult.reason || 'unknown' });
      continue;
    }

    if (!deleteResult.existed) {
      result.skippedCount += 1;
      if (stats) stats.skipped += 1;
      logger.info('cleanup delete file skipped', { filePath, reason: deleteResult.reason || 'not_found' });
      continue;
    }

    result.successCount += 1;
    result.deletedPaths.push(filePath);
    if (stats) stats.filesDeleted += 1;
    logger.info('cleanup delete file success', { filePath });
  }

  return result;
}

async function cleanupEmptyParents(filePath) {
  if (!filePath) return;
  let current = path.dirname(filePath);
  const root = path.resolve(appConfig.uploadDir);

  while (current.startsWith(root) && current !== root) {
    try {
      const items = await fs.promises.readdir(current);
      if (items.length > 0) return;
      await fs.promises.rmdir(current);
    } catch (_error) {
      return;
    }
    current = path.dirname(current);
  }
}

async function markHistoryDeleted(taskId, userId, now = new Date()) {
  const record = await PhotoTask.findOne({ where: { task_id: taskId, user_id: userId } });
  if (!record) return { found: false, deleted: false };
  if (record.deleted_at) return { found: true, deleted: false, record };

  const purgeAt = new Date(now.getTime() + appConfig.softDeleteGraceHours * 60 * 60 * 1000);
  await PhotoTask.update({
    deleted_at: now,
    file_expire_at: purgeAt,
    cleanup_status: CLEANUP_STATUS.PENDING,
    cleanup_error: null
  }, {
    where: { id: record.id }
  });

  const updated = await PhotoTask.findByPk(record.id);
  return { found: true, deleted: true, record: updated };
}

function isExpired(task, now) {
  if (task.file_expire_at) {
    return new Date(task.file_expire_at).getTime() <= now.getTime();
  }

  if (task.deleted_at) {
    const softDeleteExpireAt = new Date(task.deleted_at).getTime() + appConfig.softDeleteGraceHours * 60 * 60 * 1000;
    return softDeleteExpireAt <= now.getTime();
  }

  if (task.status === 'FAILED') {
    return new Date(task.created_at).getTime() + appConfig.failedTaskTtlHours * 60 * 60 * 1000 <= now.getTime();
  }

  return new Date(task.created_at).getTime() + appConfig.fileTtlHours * 60 * 60 * 1000 <= now.getTime();
}

async function purgeOneTask(task, now, options, stats) {
  const taskId = task.task_id;
  const candidatePaths = collectFileCandidates(task);

  if (options.dryRun) {
    logger.info('cleanup dry-run record', { taskId, candidateCount: candidatePaths.length });
    stats.purged += 1;
    return;
  }

  const deleteResult = await deletePhysicalFiles(candidatePaths, stats);
  for (const deletedPath of deleteResult.deletedPaths) {
    await cleanupEmptyParents(deletedPath);
  }

  const failed = deleteResult.failedCount;
  let status = CLEANUP_STATUS.SUCCESS;
  let cleanupError = null;
  if (failed > 0 && deleteResult.successCount > 0) {
    status = CLEANUP_STATUS.PARTIAL_FAILED;
    cleanupError = `${failed} file(s) failed to delete`;
  } else if (failed > 0) {
    status = CLEANUP_STATUS.FAILED;
    cleanupError = `${failed} file(s) failed to delete`;
  }

  await PhotoTask.update({
    purged_at: status === CLEANUP_STATUS.FAILED ? null : now,
    physical_deleted_at: status === CLEANUP_STATUS.FAILED ? null : now,
    cleanup_status: status,
    cleanup_error: cleanupError,
    source_url: null,
    preview_url: null,
    result_url: null,
    print_url: null,
    original_path: null,
    preview_path: null,
    hd_path: null,
    print_path: null
  }, {
    where: { id: task.id }
  });

  if (status === CLEANUP_STATUS.FAILED) {
    stats.failedRecords += 1;
    logger.warn('cleanup failed record', { taskId, cleanupError });
  } else {
    stats.purged += 1;
    logger.info('cleanup record purged', { taskId, cleanupStatus: status });
  }
}

async function purgeExpiredPhotos(options = {}) {
  const now = options.now || new Date();
  const batchSize = Number(options.batchSize || appConfig.cleanupBatchSize || 100);
  const stats = {
    scanned: 0,
    candidateCount: 0,
    purged: 0,
    skipped: 0,
    failed: 0,
    failedRecords: 0
  };

  logger.info('cleanup started', { dryRun: Boolean(options.dryRun), batchSize, now: now.toISOString() });

  let hasNext = true;
  while (hasNext) {
    const tasks = await PhotoTask.findAll({
      where: {
        [Op.or]: [
          { deleted_at: { [Op.not]: null } },
          { status: 'FAILED' },
          { created_at: { [Op.lte]: new Date(now.getTime() - appConfig.fileTtlHours * 60 * 60 * 1000) } }
        ],
        [Op.or]: [
          { purged_at: { [Op.is]: null } },
          { cleanup_status: { [Op.in]: [CLEANUP_STATUS.FAILED, CLEANUP_STATUS.PARTIAL_FAILED, CLEANUP_STATUS.PENDING] } }
        ]
      },
      order: [['created_at', 'ASC']],
      limit: batchSize
    });

    if (!tasks.length) {
      hasNext = false;
      break;
    }

    stats.scanned += tasks.length;

    for (const task of tasks) {
      try {
        if (!isExpired(task, now)) {
          stats.skipped += 1;
          continue;
        }

        stats.candidateCount += 1;
        await purgeOneTask(task, now, options, stats);
      } catch (error) {
        stats.failedRecords += 1;
        logger.error('cleanup failed record', {
          taskId: task.task_id,
          message: error.message
        });

        if (!options.dryRun) {
          await PhotoTask.update({
            cleanup_status: CLEANUP_STATUS.FAILED,
            cleanup_error: error.message
          }, {
            where: { id: task.id }
          });
        }
      }
    }

    hasNext = tasks.length === batchSize;
  }

  logger.info('cleanup completed', stats);
  return stats;
}

async function repairBrokenPhotoTasks(options = {}) {
  const limit = Number(options.limit || 500);
  const rows = await PhotoTask.findAll({
    where: {
      source_url: { [Op.is]: null },
      [Op.or]: [
        { original_path: { [Op.not]: null } },
        { preview_url: { [Op.not]: null } },
        { preview_path: { [Op.not]: null } },
        { result_url: { [Op.not]: null } },
        { hd_path: { [Op.not]: null } }
      ]
    },
    limit,
    order: [['created_at', 'ASC']]
  });

  const stats = { scanned: rows.length, repaired: 0, orphaned: 0 };

  for (const row of rows) {
    const fallback = row.original_path || row.preview_url || row.preview_path || row.result_url || row.hd_path || null;
    if (!fallback) {
      await PhotoTask.update({ cleanup_status: CLEANUP_STATUS.ORPHANED }, { where: { id: row.id } });
      stats.orphaned += 1;
      continue;
    }

    await PhotoTask.update({
      source_url: fallback,
      cleanup_status: CLEANUP_STATUS.PENDING,
      cleanup_error: null
    }, {
      where: { id: row.id }
    });
    stats.repaired += 1;
  }

  return stats;
}

module.exports = {
  CLEANUP_STATUS,
  collectFileCandidates,
  deletePhysicalFiles,
  markHistoryDeleted,
  purgeExpiredPhotos,
  repairBrokenPhotoTasks,
  toAbsoluteUploadPath
};
