const { v4: uuidv4 } = require('uuid');
const AppError = require('../../utils/app-error');
const photoRepository = require('./photo.repository');
const photoService = require('./photo.service');
const logger = require('../../utils/logger');
const { STAGE_TEXT, STAGE_PROGRESS } = require('../../constants/photo-task-stage');

const DEFAULT_TIMEOUT_MS = 90000;

function mapRecordStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PENDING') return 'queued';
  if (normalized === 'PROCESSING') return 'processing';
  if (normalized === 'SUCCESS') return 'success';
  if (normalized === 'FAILED') return 'failed';
  if (normalized === 'TIMEOUT') return 'timeout';
  return 'failed';
}

function buildTaskResult(task) {
  const summary = task.response_payload?.summary || {};
  if (!task.preview_url && !task.result_url) return null;

  return {
    imageId: task.task_id,
    previewUrl: task.preview_url || summary.previewUrl || null,
    hdUrl: task.result_url || summary.hdUrl || null,
    printUrl: summary.printLayoutUrl || null,
    backgroundColor: task.background_color || null,
    widthMm: summary.sizeDefinition?.widthMm || null,
    heightMm: summary.sizeDefinition?.heightMm || null,
    pixelWidth: summary.sizeDefinition?.pixelWidth || null,
    pixelHeight: summary.sizeDefinition?.pixelHeight || null,
    qualityStatus: task.quality_status || null
  };
}

function buildTaskStatusView(task) {
  return {
    taskId: task.task_id,
    status: mapRecordStatus(task.status),
    stageCode: task.stage_code || 'received',
    stageText: task.stage_text || STAGE_TEXT.received,
    progress: Number(task.progress || 0),
    errorCode: task.error_code || null,
    errorMessage: task.error_message || null,
    result: mapRecordStatus(task.status) === 'success' ? buildTaskResult(task) : null,
    createdAt: task.created_at,
    updatedAt: task.updated_at
  };
}

async function patchStage(recordId, stageCode, status = 'PROCESSING', extra = {}) {
  return photoRepository.updateById(recordId, {
    status,
    stage_code: stageCode,
    stage_text: STAGE_TEXT[stageCode] || STAGE_TEXT.received,
    progress: STAGE_PROGRESS[stageCode] ?? 0,
    ...extra
  });
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AppError('照片暂时无法完成制作，请稍后重试', 504, null, 2008));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

module.exports = {
  async createTask({ user, file, payload }) {
    if (!file) {
      throw new AppError('请先上传照片文件', 400, null, 1001);
    }

    const taskId = `task_${uuidv4().replace(/-/g, '')}`;
    const taskRecord = await photoRepository.create({
      user_id: user.id,
      task_id: taskId,
      status: 'PENDING',
      stage_code: 'received',
      stage_text: STAGE_TEXT.received,
      progress: STAGE_PROGRESS.received,
      source_url: `/uploads/original/${file.filename}`,
      size_code: payload?.sizeCode || 'unknown',
      background_color: payload?.backgroundColor || 'white',
      warnings: [],
      quality_status: 'WARNING',
      quality_message: '任务排队中',
      request_payload: {
        mode: 'idPhotoTask',
        clientRequest: payload || {}
      }
    });

    setImmediate(async () => {
      try {
        await patchStage(taskRecord.id, 'checking');
        await patchStage(taskRecord.id, 'adjusting');

        const taskResult = await withTimeout(
          photoService.processPhoto({ user, file, payload }),
          Number(process.env.PHOTO_TASK_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
        );

        await patchStage(taskRecord.id, 'finalizing');

        const latest = await photoRepository.findRawByTaskId(taskRecord.task_id);
        if (!latest || latest.status === 'TIMEOUT') {
          return;
        }

        await patchStage(taskRecord.id, 'success', 'SUCCESS', {
          preview_url: taskResult.previewUrl || null,
          result_url: taskResult.hdUrl || taskResult.resultUrl || null,
          size_code: taskResult.sizeCode || payload?.sizeCode || taskRecord.size_code,
          background_color: taskResult.backgroundColor || payload?.backgroundColor || taskRecord.background_color,
          quality_status: taskResult.qualityStatus || 'PASSED',
          quality_message: taskResult.qualityMessage || STAGE_TEXT.success,
          response_payload: {
            summary: {
              previewUrl: taskResult.previewUrl || null,
              hdUrl: taskResult.hdUrl || taskResult.resultUrl || null,
              printLayoutUrl: taskResult.printLayoutUrl || null,
              sizeDefinition: taskResult.size || null
            }
          },
          error_code: null,
          error_message: null
        });
      } catch (error) {
        const latest = await photoRepository.findRawByTaskId(taskRecord.task_id);
        if (latest && latest.status === 'TIMEOUT') return;

        const timeout = error instanceof AppError && Number(error.businessCode) === 2008;
        await patchStage(taskRecord.id, timeout ? 'timeout' : 'failed', timeout ? 'TIMEOUT' : 'FAILED', {
          quality_status: 'WARNING',
          quality_message: timeout ? STAGE_TEXT.timeout : STAGE_TEXT.failed,
          error_code: String(error.businessCode || 9001),
          error_message: error.message || '这次处理没有成功，请重新上传一张更清晰的照片再试'
        });

        logger.warn('photo async task failed', {
          taskId,
          businessCode: error.businessCode || null,
          message: error.message
        });
      }
    });

    return buildTaskStatusView(taskRecord);
  },

  async getTaskStatus(taskId, userId) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('未找到对应任务，请确认任务编号是否正确', 404, null, 4041);
    }

    return buildTaskStatusView(task);
  },

  async getTaskResult(taskId, userId) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('未找到对应任务，请确认任务编号是否正确', 404, null, 4041);
    }

    const view = buildTaskStatusView(task);
    if (view.status === 'failed') {
      throw new AppError(task.error_message || '这次处理没有成功，请重新上传一张更清晰的照片再试', 409, view, 4091);
    }
    if (view.status === 'timeout') {
      throw new AppError('处理时间稍长，请稍后重试', 409, view, 4092);
    }
    if (view.status !== 'success') {
      throw new AppError('任务还在处理中，请稍后再查看结果', 409, view, 4090);
    }

    return view;
  }
};
