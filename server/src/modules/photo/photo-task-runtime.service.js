const STAGE_DEFINITIONS = {
  received: { stageText: '已接收照片，等待开始处理', progress: 5, status: 'queued' },
  checking: { stageText: '正在检查照片', progress: 20, status: 'processing' },
  adjusting: { stageText: '正在整理人像与背景', progress: 45, status: 'processing' },
  generating: { stageText: '正在生成证件照结果', progress: 75, status: 'processing' },
  finalizing: { stageText: '正在保存最终文件', progress: 90, status: 'processing' },
  success: { stageText: '处理完成', progress: 100, status: 'success' },
  failed: { stageText: '处理失败', progress: 100, status: 'failed' }
};

class PhotoTaskRuntimeService {
  constructor() {
    this.tasks = new Map();
  }

  createTask({ taskId, userId }) {
    const now = new Date();
    const state = {
      taskId,
      userId,
      status: 'queued',
      stageCode: 'received',
      stageText: STAGE_DEFINITIONS.received.stageText,
      progress: STAGE_DEFINITIONS.received.progress,
      startedAt: now,
      updatedAt: now,
      errorCode: null,
      errorMessage: null,
      result: null,
      isCompleted: false
    };
    this.tasks.set(taskId, state);
    return this.getTaskStatus(taskId);
  }

  updateTaskStage(taskId, stageCode, patch = {}) {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const def = STAGE_DEFINITIONS[stageCode] || STAGE_DEFINITIONS.received;
    task.stageCode = stageCode;
    task.stageText = patch.stageText || def.stageText;
    task.progress = typeof patch.progress === 'number' ? patch.progress : def.progress;
    task.status = patch.status || def.status;
    task.updatedAt = new Date();
    if (Object.prototype.hasOwnProperty.call(patch, 'result')) {
      task.result = patch.result;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'errorCode')) {
      task.errorCode = patch.errorCode;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'errorMessage')) {
      task.errorMessage = patch.errorMessage;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'isCompleted')) {
      task.isCompleted = Boolean(patch.isCompleted);
    }
    return this.getTaskStatus(taskId);
  }

  markTaskSuccess(taskId, result) {
    return this.updateTaskStage(taskId, 'success', {
      status: 'success',
      result,
      errorCode: null,
      errorMessage: null,
      isCompleted: true
    });
  }

  markTaskFailed(taskId, { errorCode, errorMessage }) {
    return this.updateTaskStage(taskId, 'failed', {
      status: 'failed',
      errorCode: errorCode || 'PHOTO_PROCESS_FAILED',
      errorMessage: errorMessage || '处理失败',
      isCompleted: true
    });
  }

  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    const elapsedMs = Math.max(0, Date.now() - task.startedAt.getTime());
    return {
      taskId: task.taskId,
      status: task.status,
      stageCode: task.stageCode,
      stageText: task.stageText,
      progress: task.progress,
      startedAt: task.startedAt,
      updatedAt: task.updatedAt,
      elapsedMs,
      errorCode: task.errorCode,
      errorMessage: task.errorMessage,
      result: task.result,
      isCompleted: task.isCompleted
    };
  }
}

module.exports = new PhotoTaskRuntimeService();
