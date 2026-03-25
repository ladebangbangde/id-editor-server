const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../../utils/app-error');
const appConfig = require('../../config/app.config');
const logger = require('../../utils/logger');
const fs = require('fs');
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
const { getPhotoSpecs, mergeSpecs, validateProcessPhotoPayload, normalizeSizeCode } = require('./dto/process-photo.dto');
const { toToolSharedAbsolutePath, absoluteUploadPath, relativeUploadPath, ensureDir } = require('../../utils/file-helper');
const { FOLDERS } = require('../../constants/file');
const { toAbsolutePublicUrl } = require('../../utils/public-url');

function buildAbsoluteUrl(urlPath, req) {
  return toAbsolutePublicUrl(urlPath, req);
}

function buildToolFilePath(filePath) {
  if (!filePath) return null;
  return toToolSharedAbsolutePath(filePath);
}

function buildSourceFilePath(sourceUrl) {
  if (!sourceUrl) return null;
  try {
    const parsed = new URL(sourceUrl);
    return parsed.pathname || null;
  } catch (_error) {
    return sourceUrl.startsWith('/') ? sourceUrl : `/${sourceUrl}`;
  }
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

function buildImageMeta(url, sizeDefinition, purpose) {
  if (!url) return null;
  return {
    format: String(url).split('?')[0].split('.').pop()?.toLowerCase() || null,
    width: sizeDefinition?.pixelWidth || null,
    height: sizeDefinition?.pixelHeight || null,
    purpose
  };
}

function buildSizeDefinition(task, specs) {
  const allDefinitions = specs?.sizeDefinitions || [];
  const normalizedSizeCode = normalizeSizeCode(task.size_code) || task.size_code;
  const fromSpec = allDefinitions.find((item) => item.sizeCode === normalizedSizeCode) || null;
  const mappedGenerate = task.response_payload?.generate?.data || task.response_payload?.generate?.result || {};

  return {
    sizeCode: normalizedSizeCode,
    name: fromSpec?.name || normalizedSizeCode,
    aliases: fromSpec?.aliases || [normalizedSizeCode],
    toolSizeKey: fromSpec?.toolSizeKey || task.request_payload?.toolSizeKey || null,
    category: fromSpec?.category || null,
    featured: Boolean(fromSpec?.featured),
    widthMm: fromSpec?.widthMm || mappedGenerate.widthMm || null,
    heightMm: fromSpec?.heightMm || mappedGenerate.heightMm || null,
    pixelWidth: fromSpec?.pixelWidth || mappedGenerate.pixelWidth || null,
    pixelHeight: fromSpec?.pixelHeight || mappedGenerate.pixelHeight || null
  };
}

function normalizePreviewUrl(previewUrl, hdUrl) {
  return previewUrl || hdUrl || null;
}

function buildPhotoTaskView(task, specs, req) {
  const warnings = Array.isArray(task.warnings) ? task.warnings : [];
  const sourceUrl = toAbsolutePublicUrl(task.source_url, req);
  const hdUrl = toAbsolutePublicUrl(task.result_url, req);
  const previewUrl = normalizePreviewUrl(toAbsolutePublicUrl(task.preview_url, req), hdUrl);
  const printLayoutUrl = toAbsolutePublicUrl(task.response_payload?.summary?.printLayoutUrl || task.response_payload?.generate?.data?.printUrl || null, req);
  const requestPayload = task.request_payload?.clientRequest || {};
  const sizeDefinition = buildSizeDefinition(task, specs);
  const originalRequestedSizeKey = requestPayload.sizeCode || task.request_payload?.originalRequestedSizeKey || task.size_code;
  const normalizedSizeCode = normalizeSizeCode(task.size_code) || task.request_payload?.normalizedSizeCode || task.size_code;

  return {
    taskId: task.task_id,
    flowType: 'idPhoto',
    status: task.status,
    sourceUrl,
    originalUrl: sourceUrl,
    sourceFilePath: buildSourceFilePath(sourceUrl) || sourceUrl,
    previewUrl,
    thumbnailUrl: previewUrl,
    preview_url: previewUrl,
    hdUrl,
    hd_url: hdUrl,
    // 兼容历史客户端：resultUrl 继续返回高清图，后续统一使用 hdUrl
    resultUrl: hdUrl,
    printLayoutUrl,
    backgroundColor: task.background_color,
    sizeCode: normalizedSizeCode,
    normalizedSizeCode,
    originalRequestedSizeKey,
    toolSizeKey: sizeDefinition?.toolSizeKey || task.request_payload?.toolSizeKey || null,
    size: sizeDefinition,
    options: {
      enhance: Boolean(requestPayload.enhance),
      backgroundColor: task.background_color,
      sizeCode: normalizedSizeCode
    },
    qualityStatus: task.quality_status,
    qualityMessage: task.quality_message,
    warnings,
    previewMeta: buildImageMeta(previewUrl, sizeDefinition, 'preview'),
    hdMeta: buildImageMeta(hdUrl, sizeDefinition, 'print'),
    createdAt: task.created_at,
    editDraft: {
      flowType: 'idPhoto',
      sourceUrl,
      originalUrl: sourceUrl,
      sourceFilePath: buildSourceFilePath(sourceUrl) || sourceUrl,
      sizeCode: normalizedSizeCode,
      normalizedSizeCode,
      backgroundColor: task.background_color,
      options: {
        enhance: Boolean(requestPayload.enhance)
      },
      nextRoute: '/pages/photo/edit/index'
    }
  };
}

async function persistToolAsset(rawOutputUrl, folder) {
  if (!rawOutputUrl || !folder) return null;
  const normalized = String(rawOutputUrl).trim();
  if (!normalized) return null;
  const fileName = path.basename(normalized.split('?')[0]);
  if (!fileName || fileName === '/' || fileName === '.') return null;

  const destination = absoluteUploadPath(folder, fileName);
  await ensureDir(path.dirname(destination));

  const candidates = [];
  if (path.isAbsolute(normalized)) candidates.push(normalized);

  let pathname = normalized;
  if (/^https?:\/\//i.test(normalized)) {
    try {
      pathname = new URL(normalized).pathname || normalized;
    } catch (_error) {
      pathname = normalized;
    }
  }

  const cleanPathname = pathname.split('?')[0];
  if (cleanPathname.startsWith('/uploads/')) {
    candidates.push(path.join(appConfig.toolSharedUploadRoot, cleanPathname.replace(/^\/uploads\//, '')));
  }
  if (cleanPathname.startsWith('/')) {
    candidates.push(path.join(appConfig.toolSharedUploadRoot, cleanPathname.replace(/^\/+/, '')));
  }

  for (const source of candidates) {
    if (!source || source === destination) continue;
    if (fs.existsSync(source)) {
      await fs.promises.copyFile(source, destination);
      return relativeUploadPath(folder, fileName);
    }
  }

  return normalized;
}

function createStructuredFailureData({ taskId, message, reasons, suggestions }) {
  const normalizedReasons = Array.isArray(reasons)
    ? reasons
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'string') {
            const detail = item.trim();
            if (!detail) return null;
            return { code: 'PHOTO_PROCESS_FAILED', title: '处理失败', detail };
          }
          if (typeof item !== 'object') return null;
          const detail = typeof item.detail === 'string'
            ? item.detail.trim()
            : (typeof item.message === 'string' ? item.message.trim() : '');
          const title = typeof item.title === 'string' && item.title.trim()
            ? item.title.trim()
            : '处理失败';
          if (!detail) return null;
          return {
            code: item.code || 'PHOTO_PROCESS_FAILED',
            title,
            detail
          };
        })
        .filter(Boolean)
    : [];

  const defaultDetail = typeof message === 'string' && message.trim() ? message.trim() : '处理失败';

  return {
    taskId,
    reasons: normalizedReasons.length > 0
      ? normalizedReasons
      : [{ code: 'PHOTO_PROCESS_FAILED', title: '处理失败', detail: defaultDetail }],
    suggestions: Array.isArray(suggestions) && suggestions.length > 0
      ? suggestions
      : ['请上传清晰、正面、完整的人像照片', '请确保光线充足且背景简洁', '请保持面部无遮挡并正对镜头']
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
      formats: specs.formats,
      sizeDefinitions: specs.sizeDefinitions,
      popularSizeCodes: specs.popularSizeCodes,
      categorizedSizes: specs.categorizedSizes,
      customSizeRules: specs.customSizeRules,
      recommended: specs.recommended,
      recentlyUsed: [],
      unsupportedTemplateSceneKeys: specs.unsupportedTemplateSceneKeys
    };
  },

  async processPhoto({ user, file, payload, req }) {
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
    const selectedSizeDefinition = validation.resolvedSize?.definition
      || mergedSpecs.sizeDefinitions.find((item) => item.sizeCode === requestPayload.sizeCode)
      || null;
    const sourceUrl = buildAbsoluteUrl(`/uploads/original/${path.basename(file.path)}`, req);
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
        mode: 'idPhoto',
        clientRequest: requestPayload,
        originalRequestedSizeKey: requestPayload.originalRequestedSizeKey,
        normalizedSizeCode: requestPayload.normalizedSizeCode,
        toolSizeKey: requestPayload.toolSizeKey,
        selectedSizeDefinition,
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
          mode: 'idPhoto',
          clientRequest: requestPayload,
          originalRequestedSizeKey: requestPayload.originalRequestedSizeKey,
          normalizedSizeCode: requestPayload.normalizedSizeCode,
          toolSizeKey: requestPayload.toolSizeKey,
          selectedSizeDefinition,
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
      const persistedPreviewPath = await persistToolAsset(generateResult.previewUrl, FOLDERS.PREVIEW);
      const persistedHdPath = await persistToolAsset(generateResult.hdUrl, FOLDERS.HD);
      const persistedPrintPath = await persistToolAsset(generateResult.printUrl, FOLDERS.PRINT);
      const previewUrl = buildAbsoluteUrl(persistedPreviewPath || generateResult.previewUrl || generateResult.hdUrl, req);
      const hdUrl = buildAbsoluteUrl(persistedHdPath || generateResult.hdUrl, req);
      const printLayoutUrl = buildAbsoluteUrl(persistedPrintPath || generateResult.printUrl, req);

      const updatedRecord = await photoRepository.markSuccess(taskRecord.id, {
        task_id: generateResult.taskId || taskRecord.task_id,
        status: 'SUCCESS',
        preview_url: previewUrl,
        result_url: hdUrl,
        size_code: requestPayload.normalizedSizeCode || selectedSizeDefinition?.sizeCode || requestPayload.sizeCode,
        background_color: generateResult.backgroundColor || requestPayload.backgroundColor,
        warnings,
        quality_status: quality.qualityStatus,
        quality_message: quality.qualityMessage,
        response_payload: {
          detect: detectResponse,
          generate: toolResponse,
          summary: {
            previewUrl,
            hdUrl,
            printLayoutUrl,
            sizeDefinition: selectedSizeDefinition,
            originalRequestedSizeKey: requestPayload.originalRequestedSizeKey,
            normalizedSizeCode: requestPayload.normalizedSizeCode,
            toolSizeKey: requestPayload.toolSizeKey
          }
        },
        error_code: null,
        error_message: null
      });

      return buildPhotoTaskView(updatedRecord, mergedSpecs, req);
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

  async getPhotoHistory(userId, query = {}, req) {
    const page = normalizePaginationNumber(query.page, 1);
    const pageSize = normalizePaginationNumber(query.pageSize, 10);
    const status = normalizeHistoryStatus(query.status);

    const result = await photoRepository.findHistoryByUserId(userId, {
      page,
      pageSize,
      status
    });

    const specs = await loadRuntimeSpecs();
    return {
      list: result.rows.map((task) => buildPhotoTaskView(task, specs, req)),
      total: result.count,
      page,
      pageSize
    };
  },

  async getTaskDetail(taskId, userId, req) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }

    const specs = await loadRuntimeSpecs();
    return buildPhotoTaskView(task, specs, req);
  },

  async getTaskEditDraft(taskId, userId, req) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }

    const specs = await loadRuntimeSpecs();
    return buildPhotoTaskView(task, specs, req).editDraft;
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
