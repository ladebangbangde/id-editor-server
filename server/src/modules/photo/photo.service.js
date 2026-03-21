const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../../utils/app-error');
const appConfig = require('../../config/app.config');
const logger = require('../../utils/logger');
const idEditorToolClient = require('../../integrations/id-editor-tool/id-editor-tool.client');
const { mapToolErrorToBusiness, buildQualitySummary } = require('../../integrations/id-editor-tool/id-editor-tool.mapper');
const photoRepository = require('./photo.repository');
const { getPhotoSpecs, validateProcessPhotoPayload } = require('./dto/process-photo.dto');

function buildAbsoluteUrl(urlPath) {
  if (!urlPath) return null;
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  return new URL(urlPath.startsWith('/') ? urlPath : `/${urlPath}`, `${appConfig.baseUrl}/`).toString();
}

function normalizeWarnings(warnings) {
  if (Array.isArray(warnings)) return warnings.filter(Boolean);
  return [];
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

module.exports = {
  getSpecs() {
    return getPhotoSpecs();
  },

  async processPhoto({ user, file, payload }) {
    const validation = validateProcessPhotoPayload(payload, file);
    if (!validation.valid) {
      throw new AppError(validation.message, 400, null, validation.businessCode);
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new AppError('文件不是合法图片', 400, null, 1002);
    }

    await this.assertUserCanProcess(user);

    const requestPayload = validation.data;
    const sourceUrl = buildAbsoluteUrl(`/uploads/original/${path.basename(file.path)}`);
    const localTaskId = `photo_${uuidv4().replace(/-/g, '')}`;

    const taskRecord = await photoRepository.create({
      user_id: user.id,
      task_id: localTaskId,
      status: 'FAILED',
      source_url: sourceUrl,
      size_code: requestPayload.sizeCode,
      background_color: requestPayload.backgroundColor,
      warnings: [],
      quality_status: 'WARNING',
      quality_message: '处理中失败',
      request_payload: requestPayload
    });

    try {
      const toolResponse = await idEditorToolClient.generatePhoto(file, {
        sizeKey: requestPayload.sizeCode,
        backgroundColor: requestPayload.backgroundColor,
        enhance: requestPayload.enhance,
        saveOutput: true
      });

      const warnings = normalizeWarnings(toolResponse.data?.warnings);
      const quality = buildQualitySummary(toolResponse.data?.detect, warnings);
      const previewUrl = idEditorToolClient.createAbsoluteOutputUrl(toolResponse.data?.previewUrl);
      const resultUrl = idEditorToolClient.createAbsoluteOutputUrl(toolResponse.data?.hdUrl);

      const updatedRecord = await photoRepository.markSuccess(taskRecord.id, {
        task_id: toolResponse.data?.taskId || taskRecord.task_id,
        status: 'SUCCESS',
        preview_url: previewUrl,
        result_url: resultUrl,
        size_code: toolResponse.data?.size?.key || requestPayload.sizeCode,
        background_color: toolResponse.data?.backgroundColor || requestPayload.backgroundColor,
        warnings,
        quality_status: quality.qualityStatus,
        quality_message: quality.qualityMessage,
        response_payload: toolResponse,
        error_code: null,
        error_message: null
      });

      return {
        taskId: updatedRecord.task_id,
        status: updatedRecord.status,
        previewUrl: updatedRecord.preview_url,
        resultUrl: updatedRecord.result_url,
        backgroundColor: updatedRecord.background_color,
        sizeCode: updatedRecord.size_code,
        width: toolResponse.data?.width || null,
        height: toolResponse.data?.height || null,
        warnings,
        qualityStatus: updatedRecord.quality_status,
        qualityMessage: updatedRecord.quality_message
      };
    } catch (error) {
      const mappedError = mapToolErrorToBusiness(error);
      const failedRecord = await photoRepository.markFailed(taskRecord.id, {
        status: 'FAILED',
        warnings: [],
        quality_status: 'WARNING',
        quality_message: mappedError.message,
        error_code: error.toolCode || String(mappedError.businessCode),
        error_message: error.toolMessage || mappedError.message,
        response_payload: serializeToolError(error)
      });

      logger.warn('photo processing failed', {
        userId: user.id,
        localTaskId,
        toolCode: error.toolCode || null,
        businessCode: mappedError.businessCode,
        message: mappedError.message
      });

      throw new AppError(mappedError.message, mappedError.httpStatus, {
        taskId: failedRecord?.task_id || localTaskId
      }, mappedError.businessCode);
    }
  },

  async getTaskDetail(taskId, userId) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }

    return {
      taskId: task.task_id,
      status: task.status,
      previewUrl: task.preview_url,
      resultUrl: task.result_url,
      backgroundColor: task.background_color,
      sizeCode: task.size_code,
      qualityStatus: task.quality_status,
      qualityMessage: task.quality_message,
      warnings: Array.isArray(task.warnings) ? task.warnings : [],
      createdAt: task.created_at
    };
  },

  async assertUserCanProcess(user) {
    if (!user || !user.id) {
      throw new AppError('登录态无效', 401, null, 9001);
    }

    if (user.status !== 1) {
      throw new AppError('用户状态不可用', 403, null, 9001);
    }
  }
};
