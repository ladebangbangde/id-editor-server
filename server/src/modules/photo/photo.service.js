const fs = require('fs');
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
const photoTaskRuntimeService = require('./photo-task-runtime.service');

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



const DB_STATUS_TO_RUNTIME_STATUS = {
  PENDING: 'queued',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed'
};

const STAGE_PROGRESS_MAP = {
  received: 5,
  checking: 20,
  adjusting: 45,
  generating: 75,
  finalizing: 90,
  success: 100,
  failed: 100
};

const STAGE_TEXT_MAP = {
  received: '已接收照片，等待开始处理',
  checking: '正在检查照片',
  adjusting: '正在整理人像与背景',
  generating: '正在生成证件照结果',
  finalizing: '正在保存最终文件',
  success: '处理完成',
  failed: '处理失败'
};


function buildStageSnapshot(stageCode) {
  return {
    stageCode,
    stageText: STAGE_TEXT_MAP[stageCode] || STAGE_TEXT_MAP.received,
    progress: STAGE_PROGRESS_MAP[stageCode] ?? STAGE_PROGRESS_MAP.received,
    updatedAt: new Date().toISOString()
  };
}

function buildTaskRequestPayload(basePayload, stageCode, patch = {}) {
  return {
    ...basePayload,
    ...patch,
    taskProgress: buildStageSnapshot(stageCode)
  };
}


function appendStageHistory(stageHistory = [], stageCode) {
  const previousStageCode = stageHistory.length > 0 ? stageHistory[stageHistory.length - 1].stageCode : null;
  if (previousStageCode === stageCode) return stageHistory;
  return [...stageHistory, buildStageSnapshot(stageCode)];
}

function buildStageHistoryInfo(stageHistory = []) {
  return {
    stageCodes: stageHistory.map((item) => item.stageCode),
    stageHistory
  };
}

function buildTaskStatusFromDb(task, runtimeStatus) {
  if (!task) return null;
  const status = runtimeStatus?.status || DB_STATUS_TO_RUNTIME_STATUS[task.status] || 'processing';
  const persistedStageCode = task.request_payload?.taskProgress?.stageCode;
  let stageCode = runtimeStatus?.stageCode || persistedStageCode;
  if (!stageCode) {
    if (task.status === 'SUCCESS') stageCode = 'success';
    else if (task.status === 'FAILED') stageCode = 'failed';
    else if (task.quality_message === '图片检测中') stageCode = 'checking';
    else if (task.quality_message === '正在整理人像与背景') stageCode = 'adjusting';
    else if (task.quality_message === '证件照生成中') stageCode = 'generating';
    else if (task.quality_message === '正在保存最终文件') stageCode = 'finalizing';
    else stageCode = 'received';
  }

  const persistedStageHistory = Array.isArray(task.request_payload?.stageHistory) ? task.request_payload.stageHistory : [];
  const persistedStageCodes = Array.isArray(task.request_payload?.stageCodes) ? task.request_payload.stageCodes : persistedStageHistory.map((item) => item.stageCode);
  const startedAt = runtimeStatus?.startedAt || task.created_at;
  const updatedAt = runtimeStatus?.updatedAt || task.updated_at || task.created_at;
  return {
    taskId: task.task_id,
    status,
    stageCode,
    stageText: runtimeStatus?.stageText || task.request_payload?.taskProgress?.stageText || STAGE_TEXT_MAP[stageCode] || STAGE_TEXT_MAP.received,
    progress: runtimeStatus?.progress ?? task.request_payload?.taskProgress?.progress ?? STAGE_PROGRESS_MAP[stageCode] ?? STAGE_PROGRESS_MAP.received,
    startedAt,
    updatedAt,
    elapsedMs: Math.max(0, Date.now() - new Date(startedAt).getTime()),
    errorCode: runtimeStatus?.errorCode || task.error_code || null,
    errorMessage: runtimeStatus?.errorMessage || task.error_message || null,
    result: runtimeStatus?.result || (task.status === 'SUCCESS' ? buildPhotoTaskView(task, null) : null),
    isCompleted: runtimeStatus?.isCompleted ?? ['SUCCESS', 'FAILED'].includes(task.status),
    stageCodes: runtimeStatus?.stageCodes || persistedStageCodes,
    stageHistory: runtimeStatus?.stageHistory || persistedStageHistory
  };
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
    const prepared = await this.prepareTaskContext({ user, file, payload });
    const result = await this.executeTaskFlow(prepared, { asyncMode: false });
    return buildPhotoTaskView(result.updatedRecord, prepared.mergedSpecs);
  },

  async createPhotoTask({ user, file, payload }) {
    await this.assertUserCanProcess(user);
    const prepared = await this.prepareTaskContext({ user, file, payload });
    const runtimeStatus = photoTaskRuntimeService.createTask({
      taskId: prepared.localTaskId,
      userId: user.id
    });

    setImmediate(async () => {
      try {
        await this.executeTaskFlow(prepared, { asyncMode: true });
      } catch (error) {
        logger.warn('photo async task execution failed', {
          taskId: prepared.localTaskId,
          message: error.message,
          businessCode: error.businessCode || null
        });
      }
    });

    return runtimeStatus;
  },

  async prepareTaskContext({ user, file, payload }) {
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

    logger.info('photo source file saved', {
      uploadedFilePath: file?.path || null,
      uploadedFileExists: file?.path ? fs.existsSync(file.path) : false,
      toolImagePath: toolFilePath,
      toolImagePathExists: toolFilePath ? fs.existsSync(toolFilePath) : false
    });

    const localTaskId = `photo_${uuidv4().replace(/-/g, '')}`;
    const baseTaskRequestPayload = {
      mode: 'idPhoto',
      clientRequest: requestPayload,
      originalRequestedSizeKey: requestPayload.originalRequestedSizeKey,
      normalizedSizeCode: requestPayload.normalizedSizeCode,
      toolSizeKey: requestPayload.toolSizeKey,
      selectedSizeDefinition,
      toolFilePath
    };
    const initialStageHistory = [buildStageSnapshot('received')];

    const taskRecord = await photoRepository.create({
      user_id: user.id,
      task_id: localTaskId,
      status: 'PENDING',
      source_url: sourceUrl,
      size_code: requestPayload.sizeCode,
      background_color: requestPayload.backgroundColor,
      warnings: [],
      quality_status: 'WARNING',
      quality_message: STAGE_TEXT_MAP.received,
      request_payload: buildTaskRequestPayload(baseTaskRequestPayload, 'received', buildStageHistoryInfo(initialStageHistory))
    });

    return {
      user,
      localTaskId,
      taskRecord,
      requestPayload,
      selectedSizeDefinition,
      sourceUrl,
      toolFilePath,
      mergedSpecs,
      baseTaskRequestPayload,
      stageHistory: initialStageHistory
    };
  },

  async executeTaskFlow(context, { asyncMode = false } = {}) {
    const { user, localTaskId, taskRecord, requestPayload, selectedSizeDefinition, toolFilePath, mergedSpecs, baseTaskRequestPayload } = context;
    let stageHistory = Array.isArray(context.stageHistory) ? [...context.stageHistory] : [buildStageSnapshot('received')];

    try {
      photoTaskRuntimeService.updateTaskStage(localTaskId, 'checking');
      await photoRepository.markProcessing(taskRecord.id, {
        status: 'PROCESSING',
        quality_status: 'WARNING',
        quality_message: STAGE_TEXT_MAP.checking,
        request_payload: buildTaskRequestPayload(baseTaskRequestPayload, 'checking', buildStageHistoryInfo((stageHistory = appendStageHistory(stageHistory, 'checking'))))
      });

      const detectRequestPayload = { imagePath: toolFilePath };
      logger.info('photo detect request imagePath', {
        taskId: localTaskId,
        imagePath: detectRequestPayload.imagePath,
        imagePathExists: detectRequestPayload.imagePath ? fs.existsSync(detectRequestPayload.imagePath) : false
      });

      const detectResponse = await idEditorToolClient.detectPhoto(detectRequestPayload);
      const detectResult = mapToolDetectResult(detectResponse);
      assertDetectResult(detectResult, taskRecord.task_id);

      photoTaskRuntimeService.updateTaskStage(localTaskId, 'adjusting');
      await photoRepository.markProcessing(taskRecord.id, {
        status: 'PROCESSING',
        quality_status: 'WARNING',
        quality_message: STAGE_TEXT_MAP.adjusting,
        request_payload: buildTaskRequestPayload(baseTaskRequestPayload, 'adjusting', {
          detectRequest: detectRequestPayload,
          ...buildStageHistoryInfo((stageHistory = appendStageHistory(stageHistory, 'adjusting')))
        })
      });

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
        quality_message: STAGE_TEXT_MAP.generating,
        request_payload: buildTaskRequestPayload(baseTaskRequestPayload, 'generating', {
          detectRequest: detectRequestPayload,
          toolRequest: toolRequestPayload,
          ...buildStageHistoryInfo((stageHistory = appendStageHistory(stageHistory, 'generating')))
        })
      });

      photoTaskRuntimeService.updateTaskStage(localTaskId, 'generating');
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

      photoTaskRuntimeService.updateTaskStage(localTaskId, 'finalizing');
      await photoRepository.markProcessing(taskRecord.id, {
        status: 'PROCESSING',
        quality_status: 'WARNING',
        quality_message: STAGE_TEXT_MAP.finalizing,
        request_payload: buildTaskRequestPayload(baseTaskRequestPayload, 'finalizing', {
          detectRequest: detectRequestPayload,
          toolRequest: toolRequestPayload,
          ...buildStageHistoryInfo((stageHistory = appendStageHistory(stageHistory, 'finalizing')))
        })
      });

      const updatedRecord = await photoRepository.markSuccess(taskRecord.id, {
        task_id: taskRecord.task_id,
        status: 'SUCCESS',
        preview_url: previewUrl,
        result_url: hdUrl,
        size_code: requestPayload.normalizedSizeCode || selectedSizeDefinition?.sizeCode || requestPayload.sizeCode,
        background_color: generateResult.backgroundColor || requestPayload.backgroundColor,
        warnings,
        quality_status: quality.qualityStatus,
        quality_message: quality.qualityMessage,
        request_payload: buildTaskRequestPayload(baseTaskRequestPayload, 'success', {
          detectRequest: detectRequestPayload,
          toolRequest: toolRequestPayload,
          ...buildStageHistoryInfo((stageHistory = appendStageHistory(stageHistory, 'success')))
        }),
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

      const view = buildPhotoTaskView(updatedRecord, mergedSpecs);
      photoTaskRuntimeService.markTaskSuccess(localTaskId, {
        taskId: view.taskId,
        status: view.status,
        previewUrl: view.previewUrl,
        hdUrl: view.hdUrl,
        resultUrl: view.resultUrl,
        sizeCode: view.sizeCode,
        qualityStatus: view.qualityStatus,
        qualityMessage: view.qualityMessage,
        warnings: view.warnings,
        candidates: view.candidates,
        completedAt: new Date().toISOString()
      });

      return { updatedRecord, view };
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
        request_payload: buildTaskRequestPayload(baseTaskRequestPayload, 'failed', buildStageHistoryInfo((stageHistory = appendStageHistory(stageHistory, 'failed')))),
        error_code: error.toolCode || String(mappedError.businessCode),
        error_message: error.toolMessage || error.message || mappedError.message,
        response_payload: error instanceof AppError ? null : serializeToolError(error)
      });

      photoTaskRuntimeService.markTaskFailed(localTaskId, {
        errorCode: error.toolCode || String(mappedError.businessCode),
        errorMessage: error.toolMessage || error.message || mappedError.message
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

      if (asyncMode) {
        return { failedRecord, mappedError };
      }

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

  async getTaskStatus(taskId, userId) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }
    const runtimeStatus = photoTaskRuntimeService.getTaskStatus(taskId);
    return buildTaskStatusFromDb(task, runtimeStatus);
  },

  async getTaskResult(taskId, userId) {
    const task = await photoRepository.findByTaskId(taskId, userId);
    if (!task) {
      throw new AppError('任务不存在', 404, null, 404);
    }

    if (task.status !== 'SUCCESS') {
      const runtimeStatus = photoTaskRuntimeService.getTaskStatus(taskId);
      throw new AppError('任务尚未完成', 409, {
        taskId,
        status: buildTaskStatusFromDb(task, runtimeStatus)
      }, 409);
    }

    const specs = await loadRuntimeSpecs();
    return buildPhotoTaskView(task, specs);
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
