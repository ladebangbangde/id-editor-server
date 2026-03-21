const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../../utils/app-error');
const appConfig = require('../../config/app.config');
const logger = require('../../utils/logger');
const idEditorToolClient = require('../../integrations/id-editor-tool/id-editor-tool.client');
const {
  mapToolErrorToBusiness,
  mapToolDetectResult,
  mapToolGenerateResult,
  buildQualitySummary,
  buildGeneratePhotoPayload,
  buildFailureDetails,
  inferBusinessErrorKey
} = require('../../integrations/id-editor-tool/id-editor-tool.mapper');
const photoRepository = require('./photo.repository');
const { getPhotoSpecs, mergeSpecs, validateProcessPhotoPayload } = require('./dto/process-photo.dto');
const { toToolSharedAbsolutePath } = require('../../utils/file-helper');

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

function createStructuredFailureData({ taskId, message, reasons, suggestions }) {
  return {
    taskId,
    reasons: Array.isArray(reasons) && reasons.length > 0 ? reasons : [message],
    suggestions: Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : ['请上传清晰、正面、完整的人像照片后重试']
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

function assertDetectResult(detectResult, taskId) {
  if (detectResult.hasFace === false) {
    throw new AppError('未检测到有效人像', 400, createStructuredFailureData({
      taskId,
      message: '未检测到有效人像',
      reasons: detectResult.reasons,
      suggestions: detectResult.suggestions
    }), 1004);
  }

  if (typeof detectResult.faceCount === 'number' && detectResult.faceCount > 1) {
    throw new AppError('检测到多个人像', 400, createStructuredFailureData({
      taskId,
      message: '检测到多个人像',
      reasons: detectResult.reasons,
      suggestions: detectResult.suggestions
    }), 1005);
  }
}

async function loadRuntimeSpecs() {
  return getPhotoSpecs();
}

module.exports = {
  async getSpecs() {
    const specs = await loadRuntimeSpecs();
    return {
      backgroundColors: specs.backgroundColors,
      sizeCodes: specs.sizeCodes,
      papers: specs.papers,
      formats: specs.formats
    };
  },

  async processPhoto({ user, file, payload }) {
    await this.assertUserCanProcess(user);

    const specs = await loadRuntimeSpecs();
    const validation = validateProcessPhotoPayload(payload, file, specs);
    if (!validation.valid) {
      throw new AppError(validation.message, 400, createStructuredFailureData({ taskId: null, message: validation.message }), validation.businessCode);
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new AppError('文件不是合法图片', 400, createStructuredFailureData({ taskId: null, message: '文件不是合法图片' }), 1002);
    }

    const requestPayload = validation.data;
    const mergedSpecs = validation.specs || mergeSpecs(specs);
    const selectedSizeDefinition = mergedSpecs.sizeDefinitions.find((item) => item.sizeCode === requestPayload.sizeCode) || null;
    const sourceUrl = buildAbsoluteUrl(`/uploads/original/${path.basename(file.path)}`);
    const toolFilePath = buildToolFilePath(file.path);
    const localTaskId = `photo_${uuidv4().replace(/-/g, '')}`;

    const taskRecord = await photoRepository.create({
      user_id: user.id,
      task_id: localTaskId,
      status: 'PROCESSING',
      source_url: sourceUrl,
      size_code: requestPayload.sizeCode,
      background_color: requestPayload.backgroundColor,
      warnings: [],
      quality_status: 'WARNING',
      quality_message: '任务处理中',
      request_payload: {
        clientRequest: requestPayload,
        toolFilePath
      }
    });

    try {
      await photoRepository.markProcessing(taskRecord.id, {
        status: 'PROCESSING',
        quality_status: 'WARNING',
        quality_message: '图片检测中'
      });

      const detectRequestPayload = {
        imagePath: toolFilePath
      };
      const detectResponse = await idEditorToolClient.detectPhoto(detectRequestPayload);
      const detectResult = mapToolDetectResult(detectResponse);
      assertDetectResult(detectResult, taskRecord.task_id);

      const toolRequestPayload = buildGeneratePhotoPayload({
        storedImagePath: toolFilePath,
        sizeCode: requestPayload.sizeCode,
        backgroundColor: requestPayload.backgroundColor,
        enhance: requestPayload.enhance,
        sizeDefinition: selectedSizeDefinition
      });

      await photoRepository.markProcessing(taskRecord.id, {
        status: 'PROCESSING',
        quality_status: 'WARNING',
        quality_message: '证件照生成中',
        request_payload: {
          clientRequest: requestPayload,
          toolFilePath,
          detectRequest: detectRequestPayload,
          toolRequest: toolRequestPayload
        }
      });

      const toolResponse = await idEditorToolClient.generatePhoto(toolRequestPayload);
      const generateResult = mapToolGenerateResult(toolResponse);
      if (!generateResult.previewUrl || !generateResult.hdUrl) {
        throw new AppError('图像处理失败', 502, null, 2003);
      }
      const quality = buildQualitySummary(detectResult, generateResult);
      const warnings = normalizeTaskWarnings([
        ...(detectResult.reasons || []),
        detectResult.pass === false ? detectResult.message : null,
        ...(generateResult.warnings || [])
      ]);
      const previewUrl = idEditorToolClient.createAbsoluteOutputUrl(generateResult.previewUrl);
      const resultUrl = idEditorToolClient.createAbsoluteOutputUrl(generateResult.hdUrl);

      const updatedRecord = await photoRepository.markSuccess(taskRecord.id, {
        task_id: generateResult.taskId || taskRecord.task_id,
        status: 'SUCCESS',
        preview_url: previewUrl,
        result_url: resultUrl,
        size_code: selectedSizeDefinition?.sizeCode || requestPayload.sizeCode,
        background_color: generateResult.backgroundColor || requestPayload.backgroundColor,
        warnings,
        quality_status: quality.qualityStatus,
        quality_message: quality.qualityMessage,
        response_payload: {
          detect: detectResponse,
          generate: toolResponse
        },
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
        width: generateResult.pixelWidth,
        height: generateResult.pixelHeight,
        widthMm: generateResult.widthMm,
        heightMm: generateResult.heightMm,
        warnings,
        qualityStatus: updatedRecord.quality_status,
        qualityMessage: updatedRecord.quality_message
      };
    } catch (error) {
      const mappedError = error instanceof AppError
        ? {
            httpStatus: error.statusCode || 400,
            businessCode: error.businessCode || 9001,
            message: error.message
          }
        : mapToolErrorToBusiness(error);

      const failedRecord = await photoRepository.markFailed(taskRecord.id, {
        status: 'FAILED',
        warnings: [],
        quality_status: 'WARNING',
        quality_message: mappedError.message,
        error_code: error.toolCode || String(mappedError.businessCode),
        error_message: error.toolMessage || error.message || mappedError.message,
        response_payload: error instanceof AppError ? null : serializeToolError(error)
      });

      logger.warn('photo processing failed', {
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
          errorKey: inferBusinessErrorKey(error)
        })
      });

      throw new AppError(mappedError.message, mappedError.httpStatus, structuredFailure, mappedError.businessCode);
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
      throw new AppError('登录态无效', 401, createStructuredFailureData({ taskId: null, message: '登录态无效' }), 9001);
    }

    if (user.status !== 1) {
      throw new AppError('用户状态不可用', 403, createStructuredFailureData({ taskId: null, message: '用户状态不可用' }), 9001);
    }
  }
};
