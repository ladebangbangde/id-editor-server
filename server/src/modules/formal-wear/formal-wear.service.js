const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../../utils/app-error');
const logger = require('../../utils/logger');
const appConfig = require('../../config/app.config');
const idEditorToolClient = require('../../integrations/id-editor-tool/id-editor-tool.client');
const {
  mapToolErrorToBusiness,
  mapToolFormalWearResult,
  buildFormalWearPayload,
  buildFailureDetails,
  inferBusinessErrorKey
} = require('../../integrations/id-editor-tool/id-editor-tool.mapper');
const { toToolSharedAbsolutePath } = require('../../utils/file-helper');
const formalWearRepository = require('./formal-wear.repository');
const {
  FORMAL_WEAR_SIZE_CODE,
  FORMAL_WEAR_DEFAULT_STATUS,
  FORMAL_WEAR_DEFAULT_QUALITY_STATUS,
  FORMAL_WEAR_DEFAULT_QUALITY_MESSAGE
} = require('./formal-wear.constants');
const { validateFormalWearPayload } = require('./dto/process-formal-wear.dto');

function buildAbsoluteUrl(urlPath) {
  if (!urlPath) return null;
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  return new URL(urlPath.startsWith('/') ? urlPath : `/${urlPath}`, `${appConfig.baseUrl}/`).toString();
}

function buildToolFilePath(filePath) {
  if (!filePath) return null;
  return toToolSharedAbsolutePath(filePath);
}

function serializeToolError(error) {
  return {
    type: error.type || 'UNKNOWN',
    toolCode: error.toolCode || null,
    toolMessage: error.toolMessage || error.message,
    httpStatus: error.httpStatus || null,
    payload: error.payload || null
  };
}

function normalizeTaskWarnings(warnings) {
  return Array.isArray(warnings) ? warnings.filter(Boolean) : [];
}

function normalizePaginationNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function normalizeHistoryStatus(status) {
  if (!status) return null;
  const normalized = String(status).trim().toUpperCase();
  return normalized || null;
}

function serializeTask(task) {
  const requestPayload = task.request_payload || {};

  return {
    taskId: task.task_id,
    status: task.status,
    previewUrl: task.preview_url,
    resultUrl: task.result_url,
    gender: requestPayload.gender || null,
    style: requestPayload.style || null,
    color: task.background_color || requestPayload.color || null,
    warnings: Array.isArray(task.warnings) ? task.warnings : [],
    qualityStatus: task.quality_status,
    qualityMessage: task.quality_message,
    createdAt: task.created_at
  };
}

function createStructuredFailureData({ taskId, message, reasons, suggestions }) {
  return {
    taskId,
    reasons: Array.isArray(reasons) && reasons.length > 0 ? reasons : [message],
    suggestions: Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : ['请上传清晰、正面、肩颈完整的单人照片后重试']
  };
}

function buildAppErrorFailureData(error, taskId) {
  const existing = error?.data && typeof error.data === 'object' ? error.data : {};
  return createStructuredFailureData({
    taskId: existing.taskId || taskId,
    message: error.message,
    reasons: existing.reasons,
    suggestions: existing.suggestions
  });
}

module.exports = {
  async processFormalWear({ user, file, payload }) {
    await this.assertUserCanProcess(user);

    const validation = validateFormalWearPayload(payload, file);
    if (!validation.valid) {
      throw new AppError(validation.message, 400, createStructuredFailureData({ taskId: null, message: validation.message }), validation.businessCode);
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new AppError('文件不是合法图片', 400, createStructuredFailureData({ taskId: null, message: '文件不是合法图片' }), 1002);
    }

    const requestPayload = validation.data;
    const sourceUrl = buildAbsoluteUrl(`/uploads/original/${path.basename(file.path)}`);
    const toolFilePath = buildToolFilePath(file.path);
    const localTaskId = `formal_wear_${uuidv4().replace(/-/g, '')}`;

    const taskRecord = await formalWearRepository.create({
      user_id: user.id,
      task_id: localTaskId,
      status: 'PROCESSING',
      source_url: sourceUrl,
      size_code: FORMAL_WEAR_SIZE_CODE,
      background_color: requestPayload.color,
      warnings: [],
      quality_status: 'WARNING',
      quality_message: '任务处理中',
      request_payload: {
        mode: 'formalWear',
        ...requestPayload,
        clientRequest: requestPayload,
        toolFilePath
      }
    });

    try {
      const toolRequestPayload = buildFormalWearPayload({
        storedImagePath: toolFilePath,
        ...requestPayload
      });

      await formalWearRepository.markProcessing(taskRecord.id, {
        status: 'PROCESSING',
        quality_status: 'WARNING',
        quality_message: '换装生成中',
        request_payload: {
          mode: 'formalWear',
          ...requestPayload,
          clientRequest: requestPayload,
          toolFilePath,
          toolRequest: toolRequestPayload
        }
      });

      const toolResponse = await idEditorToolClient.generateFormalWear(toolRequestPayload);
      const generateResult = mapToolFormalWearResult(toolResponse);
      if (!generateResult.previewUrl || !generateResult.hdUrl) {
        throw new AppError('换装生成失败', 502, null, 2101);
      }

      const warnings = normalizeTaskWarnings(generateResult.warnings || []);
      const previewUrl = idEditorToolClient.createAbsoluteOutputUrl(generateResult.previewUrl);
      const resultUrl = idEditorToolClient.createAbsoluteOutputUrl(generateResult.hdUrl);

      const updatedRecord = await formalWearRepository.markSuccess(taskRecord.id, {
        task_id: generateResult.taskId || taskRecord.task_id,
        status: FORMAL_WEAR_DEFAULT_STATUS,
        preview_url: previewUrl,
        result_url: resultUrl,
        background_color: generateResult.color || requestPayload.color,
        warnings,
        quality_status: generateResult.qualityStatus || FORMAL_WEAR_DEFAULT_QUALITY_STATUS,
        quality_message: generateResult.qualityMessage || FORMAL_WEAR_DEFAULT_QUALITY_MESSAGE,
        response_payload: {
          mode: 'formalWear',
          raw: toolResponse,
          mapped: generateResult
        },
        error_code: null,
        error_message: null
      });

      return {
        taskId: updatedRecord.task_id,
        status: updatedRecord.status,
        previewUrl: updatedRecord.preview_url,
        resultUrl: updatedRecord.result_url,
        gender: generateResult.gender || requestPayload.gender,
        style: generateResult.style || requestPayload.style,
        color: updatedRecord.background_color,
        warnings,
        qualityStatus: updatedRecord.quality_status,
        qualityMessage: updatedRecord.quality_message,
        createdAt: updatedRecord.created_at
      };
    } catch (error) {
      const mappedError = error instanceof AppError
        ? {
            httpStatus: error.statusCode || 400,
            businessCode: error.businessCode || 9001,
            message: error.message
          }
        : mapToolErrorToBusiness(error, { scenario: 'formalWear' });

      const failedRecord = await formalWearRepository.markFailed(taskRecord.id, {
        status: 'FAILED',
        warnings: [],
        quality_status: 'WARNING',
        quality_message: mappedError.message,
        error_code: error.toolCode || String(mappedError.businessCode),
        error_message: error.toolMessage || error.message || mappedError.message,
        response_payload: error instanceof AppError ? null : serializeToolError(error)
      });

      logger.warn('formal wear processing failed', {
        userId: user.id,
        localTaskId,
        toolCode: error.toolCode || null,
        toolMessage: error.toolMessage || null,
        toolPayload: error.payload || null,
        businessCode: mappedError.businessCode,
        message: mappedError.message
      });

      if (error instanceof AppError) {
        throw new AppError(
          error.message,
          error.statusCode,
          buildAppErrorFailureData(error, failedRecord?.task_id || localTaskId),
          error.businessCode
        );
      }

      const structuredFailure = createStructuredFailureData({
        taskId: failedRecord?.task_id || localTaskId,
        message: mappedError.message,
        ...buildFailureDetails({
          error,
          fallbackMessage: mappedError.message,
          errorKey: inferBusinessErrorKey(error, { scenario: 'formalWear' })
        })
      });

      throw new AppError(mappedError.message, mappedError.httpStatus, structuredFailure, mappedError.businessCode);
    }
  },

  async getFormalWearHistory(userId, query = {}) {
    const page = normalizePaginationNumber(query.page, 1);
    const pageSize = normalizePaginationNumber(query.pageSize, 10);
    const status = normalizeHistoryStatus(query.status);

    const result = await formalWearRepository.findHistoryByUserId(userId, {
      page,
      pageSize,
      status
    });

    return {
      list: result.rows.map(serializeTask),
      total: result.count,
      page,
      pageSize
    };
  },

  async getTaskDetail(taskId, userId) {
    const task = await formalWearRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }

    return serializeTask(task);
  },

  async assertUserCanProcess(user) {
    if (!user || !user.id) {
      throw new AppError('登录态无效', 401, createStructuredFailureData({ taskId: null, message: '登录态无效' }), 9001);
    }

    if (user.status !== 1) {
      throw new AppError('用户状态不可用', 403, createStructuredFailureData({ taskId: null, message: '用户状态不可用' }), 9001);
    }
  }
};
