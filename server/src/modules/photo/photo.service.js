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
const { getPhotoSpecs, mergeSpecs, validateProcessPhotoPayload, normalizeSizeCode } = require('./dto/process-photo.dto');
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
  if (!status) return { raw: null, statuses: null };
  const normalized = String(status).trim().toUpperCase();
  if (!normalized) return { raw: null, statuses: null };

  const statusAliasMap = {
    COMPLETED: ['SUCCESS'],
    FINISHED: ['SUCCESS'],
    DONE: ['SUCCESS'],
    ALL: null
  };

  const mappedStatuses = statusAliasMap[normalized] ?? [normalized];
  return {
    raw: normalized,
    statuses: mappedStatuses
  };
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

function buildPhotoTaskView(task, specs) {
  const warnings = Array.isArray(task.warnings) ? task.warnings : [];
  const sourceUrl = task.source_url;
  const hdUrl = task.result_url;
  const previewUrl = task.preview_url;
  const printLayoutUrl = task.response_payload?.generate?.data?.printUrl || null;
  const requestPayload = task.request_payload?.clientRequest || {};
  const sizeDefinition = buildSizeDefinition(task, specs);
  const originalRequestedSizeKey = requestPayload.sizeCode || task.request_payload?.originalRequestedSizeKey || task.size_code;
  const normalizedSizeCode = normalizeSizeCode(task.size_code) || task.request_payload?.normalizedSizeCode || task.size_code;
  const rawCandidates = Array.isArray(task.response_payload?.summary?.candidates) ? task.response_payload.summary.candidates : [];
  const candidates = rawCandidates.length > 0
    ? rawCandidates.map((candidate, index) => {
        const previewUrlCandidate = candidate?.previewUrl || candidate?.imageUrl || null;
        const hdUrlCandidate = candidate?.hdUrl || candidate?.resultUrl || null;
        return {
          candidateId: candidate?.candidateId || `candidate_${index + 1}`,
          source: candidate?.source || null,
          engine: candidate?.engine || candidate?.source || null,
          imageUrl: previewUrlCandidate || hdUrlCandidate || null,
          previewUrl: previewUrlCandidate || hdUrlCandidate || null,
          hdUrl: hdUrlCandidate || previewUrlCandidate || null,
          resultUrl: hdUrlCandidate || previewUrlCandidate || null,
          status: candidate?.status || null,
          failureReason: candidate?.failureReason || null
        };
      })
    : (previewUrl || hdUrl)
      ? [{
          candidateId: 'primary_candidate',
          source: null,
          engine: null,
          imageUrl: previewUrl || hdUrl,
          previewUrl: previewUrl || hdUrl,
          hdUrl: hdUrl || previewUrl,
          resultUrl: hdUrl || previewUrl,
          status: task.status === 'SUCCESS' ? 'SUCCESS' : task.status,
          failureReason: null
        }]
      : [];

  return {
    taskId: task.task_id,
    flowType: 'idPhoto',
    status: task.status,
    sourceUrl,
    originalUrl: sourceUrl,
    sourceFilePath: buildSourceFilePath(sourceUrl) || sourceUrl,
    previewUrl,
    hdUrl,
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
    candidates,
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

function isLegacyFormalWearTask(task) {
  if (!task) return false;
  if (task.size_code === photoRepository.LEGACY_FORMAL_WEAR_SIZE_CODE) return true;
  const mode = task.request_payload?.mode;
  return typeof mode === 'string' && mode.toLowerCase() === 'formalwear';
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

  async processPhoto({ user, file, payload }) {
    await this.assertUserCanProcess(user);

    const specs = await loadRuntimeSpecs();
    const validation = validateProcessPhotoPayload(payload, file, specs);
    if (!validation.valid) {
      logger.warn('photo process payload validation failed', {
        userId: user?.id || null,
        businessCode: validation.businessCode || 1006,
        reason: validation.reason || null,
        message: validation.message,
        details: validation.details || null,
        requestBody: payload || {},
        receivedFile: file
          ? {
              fieldName: file.fieldname || null,
              originalName: file.originalname || null,
              mimeType: file.mimetype || null,
              size: file.size || null
            }
          : null
      });
      throw new AppError(
        validation.message,
        400,
        {
          ...createStructuredFailureData({ taskId: null, message: validation.message }),
          validation: {
            reason: validation.reason || null,
            details: validation.details || null,
            receivedBody: payload || {}
          }
        },
        validation.businessCode
      );
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new AppError('文件不是合法图片', 400, createStructuredFailureData({ taskId: null, message: '文件不是合法图片' }), 1002);
    }

    const requestPayload = validation.data;
    const mergedSpecs = validation.specs || mergeSpecs(specs);
    const selectedSizeDefinition = validation.resolvedSize?.definition
      || mergedSpecs.sizeDefinitions.find((item) => item.sizeCode === requestPayload.sizeCode)
      || null;
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
      const previewUrl = idEditorToolClient.createAbsoluteOutputUrl(generateResult.previewUrl);
      const hdUrl = idEditorToolClient.createAbsoluteOutputUrl(generateResult.hdUrl);
      const candidates = Array.isArray(generateResult.candidates)
        ? generateResult.candidates.map((candidate, index) => {
            const previewUrlCandidate = idEditorToolClient.createAbsoluteOutputUrl(candidate.previewUrl || candidate.imageUrl);
            const hdUrlCandidate = idEditorToolClient.createAbsoluteOutputUrl(candidate.hdUrl || candidate.resultUrl);
            return {
              candidateId: candidate.candidateId || `candidate_${index + 1}`,
              source: candidate.source || null,
              engine: candidate.engine || candidate.source || null,
              imageUrl: previewUrlCandidate || hdUrlCandidate || null,
              previewUrl: previewUrlCandidate || hdUrlCandidate || null,
              hdUrl: hdUrlCandidate || previewUrlCandidate || null,
              resultUrl: hdUrlCandidate || previewUrlCandidate || null,
              status: candidate.status || null,
              failureReason: candidate.failureReason || null
            };
          })
        : [];

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
            printLayoutUrl: idEditorToolClient.createAbsoluteOutputUrl(generateResult.printUrl),
            candidates,
            sizeDefinition: selectedSizeDefinition,
            originalRequestedSizeKey: requestPayload.originalRequestedSizeKey,
            normalizedSizeCode: requestPayload.normalizedSizeCode,
            toolSizeKey: requestPayload.toolSizeKey
          }
        },
        error_code: null,
        error_message: null
      });

      logger.info('photo process candidates assembled', {
        taskId: updatedRecord.task_id,
        candidates: candidates.map((candidate) => ({
          candidateId: candidate.candidateId,
          source: candidate.source || null,
          engine: candidate.engine || null,
          previewUrl: candidate.previewUrl || null,
          hdUrl: candidate.hdUrl || null,
          status: candidate.status || null,
          failureReason: candidate.failureReason || null
        }))
      });

      return buildPhotoTaskView(updatedRecord, mergedSpecs);
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

  async getPhotoHistory(user, query = {}) {
    const userId = user?.id;
    const page = normalizePaginationNumber(query.page, 1);
    const pageSize = normalizePaginationNumber(query.pageSize, 10);
    const normalizedStatus = normalizeHistoryStatus(query.status);
    const statusFilters = normalizedStatus.statuses;

    logger.info('photo history request user context', {
      userId: userId || null,
      openid: user?.openid || null,
      unionid: user?.unionid || null,
      accountId: user?.accountId || null
    });
    logger.info('photo history query conditions', {
      userId: userId || null,
      page,
      pageSize,
      statusRaw: normalizedStatus.raw,
      statusFilters: statusFilters || []
    });

    const result = await photoRepository.findHistoryByUserId(userId, {
      page,
      pageSize,
      statuses: statusFilters
    });
    logger.info('photo history db raw result', {
      userId: userId || null,
      dbTotal: result.count,
      dbRows: result.rows.length
    });

    const filteredRows = result.rows.filter((task) => {
      if (isLegacyFormalWearTask(task)) {
        logger.info('photo history record filtered', {
          taskId: task.task_id,
          reason: 'legacy_formal_wear_task'
        });
        return false;
      }
      return true;
    });
    logger.info('photo history service filtered result', {
      userId: userId || null,
      beforeFilter: result.rows.length,
      afterFilter: filteredRows.length
    });

    const specs = await loadRuntimeSpecs();
    const viewList = filteredRows.map((task) => buildPhotoTaskView(task, specs));
    logger.info('photo history final response result', {
      userId: userId || null,
      beforeViewTransform: filteredRows.length,
      finalListCount: viewList.length
    });

    return {
      list: viewList,
      total: result.count,
      page,
      pageSize
    };
  },

  async getTaskDetail(taskId, userId) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }

    const specs = await loadRuntimeSpecs();
    return buildPhotoTaskView(task, specs);
  },

  async getTaskEditDraft(taskId, userId) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }

    const specs = await loadRuntimeSpecs();
    return buildPhotoTaskView(task, specs).editDraft;
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
