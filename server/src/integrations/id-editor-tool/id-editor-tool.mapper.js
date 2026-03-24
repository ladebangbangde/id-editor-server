const { TOOL_ERROR_TYPES, TOOL_QUALITY_STATUS, TOOL_SOURCE_TYPES } = require('./id-editor-tool.types');

const TOOL_TO_BUSINESS_ERROR = {
  INVALID_IMAGE: { httpStatus: 400, businessCode: 1002, message: '文件不是合法图片' },
  NO_FACE_DETECTED: { httpStatus: 400, businessCode: 1004, message: '未检测到人脸' },
  MULTIPLE_FACES_DETECTED: { httpStatus: 400, businessCode: 1005, message: '检测到多人脸' },
  IMAGE_TOO_SMALL: { httpStatus: 400, businessCode: 1003, message: '图片尺寸过小' },
  INVALID_ARGUMENT: { httpStatus: 400, businessCode: 1006, message: '参数非法' },
  INCOMPLETE_SHOULDER_NECK: { httpStatus: 400, businessCode: 1105, message: '肩颈区域不完整' },
  UNSUITABLE_FORMAL_WEAR_IMAGE: { httpStatus: 400, businessCode: 1106, message: '图片不适合换装' },
  PROCESS_FAILED: { httpStatus: 502, businessCode: 2003, message: '图像处理失败' },
  FORMAL_WEAR_FAILED: { httpStatus: 502, businessCode: 2101, message: '换装生成失败' }
};

const DEFAULT_SIZE_SOURCE_TYPE = TOOL_SOURCE_TYPES.SCENE;
const DEFAULT_PRINT_LAYOUT = 'six';

const DEFAULT_FAILURE_SUGGESTIONS = {
  INVALID_IMAGE: ['请上传清晰且格式合法的图片文件'],
  NO_FACE_DETECTED: ['请上传包含清晰正脸的人像照片'],
  MULTIPLE_FACES_DETECTED: ['请确保画面中仅有一人入镜'],
  IMAGE_TOO_SMALL: ['请上传分辨率更高、头像区域更清晰的照片'],
  INVALID_ARGUMENT: ['请检查参数后重试'],
  INCOMPLETE_SHOULDER_NECK: ['请上传肩颈完整、人物居中的正面照片'],
  UNSUITABLE_FORMAL_WEAR_IMAGE: ['请上传清晰、光线均匀、无遮挡的正面半身照'],
  PROCESS_FAILED: ['请上传清晰、正面、完整的人像照片后重试'],
  FORMAL_WEAR_FAILED: ['请更换一张肩颈完整的清晰人像后重试']
};

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function unwrapToolData(payload) {
  if (payload == null) return null;
  if (payload.data != null) return payload.data;
  if (payload.result != null) return payload.result;
  if (payload.payload != null) return payload.payload;
  return payload;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function pickFirstNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function normalizeTextList(value) {
  return unique(toArray(value).map((item) => {
    if (typeof item === 'string') return item.trim();
    if (item && typeof item === 'object') {
      return pickFirstString(item.message, item.reason, item.suggestion, item.text, item.title, item.code);
    }
    return null;
  }));
}

function normalizeFailureReasonItem(item, fallbackCode = null) {
  if (!item) return null;

  if (typeof item === 'string') {
    const detail = item.trim();
    if (!detail) return null;
    return {
      code: fallbackCode || 'TOOL_ERROR',
      title: '处理失败',
      detail
    };
  }

  if (typeof item !== 'object') return null;

  const detail = pickFirstString(item.detail, item.message, item.reason, item.text, item.description, item.msg);
  const title = pickFirstString(item.title, item.name, item.label, item.summary, item.type) || '处理失败';
  const code = pickFirstString(item.code, item.errorCode, item.reasonCode, item.key, fallbackCode) || 'TOOL_ERROR';

  if (!detail && !title) return null;

  return {
    code,
    title,
    detail: detail || title
  };
}

function dedupeFailureReasons(items = []) {
  const result = [];
  const seen = new Set();

  for (const item of items) {
    if (!item) continue;
    const key = `${item.code || ''}|${item.title || ''}|${item.detail || ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'pass', 'passed', 'ok'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'fail', 'failed'].includes(normalized)) return false;
  }
  return null;
}

function normalizeColorItem(item) {
  if (typeof item === 'string') return item.trim().toLowerCase();
  if (!item || typeof item !== 'object') return null;
  return pickFirstString(item.code, item.key, item.value, item.color, item.name)?.toLowerCase() || null;
}

function normalizeSizeItem(item) {
  if (!item || typeof item !== 'object') return null;

  const sizeCode = pickFirstString(item.sizeCode, item.code, item.sceneKey, item.key, item.id);
  if (!sizeCode) return null;

  const sourceType = pickFirstString(item.sourceType, item.type, DEFAULT_SIZE_SOURCE_TYPE) || DEFAULT_SIZE_SOURCE_TYPE;
  const backgroundColors = unique(
    toArray(item.backgroundColors || item.supportedBackgroundColors || item.colors)
      .map(normalizeColorItem)
  );

  return {
    sizeCode,
    sceneKey: pickFirstString(item.sceneKey, item.key, sizeCode),
    sourceType,
    name: pickFirstString(item.name, item.label, item.title, sizeCode),
    widthMm: pickFirstNumber(item.widthMm, item.width, item.customWidthMm),
    heightMm: pickFirstNumber(item.heightMm, item.height, item.customHeightMm),
    pixelWidth: pickFirstNumber(item.pixelWidth, item.widthPx, item.width_px),
    pixelHeight: pickFirstNumber(item.pixelHeight, item.heightPx, item.height_px),
    paper: pickFirstString(item.paper, item.paperCode, item.paperType, item.layoutType, item.printLayoutType),
    format: pickFirstString(item.format, item.fileFormat, item.imageFormat, item.ext),
    backgroundColors
  };
}

function extractColorList(response) {
  const data = unwrapToolData(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.colors)) return data.colors;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  return [];
}

function extractPhotoSizeList(response) {
  const data = unwrapToolData(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.photoSizes)) return data.photoSizes;
  if (Array.isArray(data?.sizes)) return data.sizes;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  return [];
}

function extractFailureDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return { reasons: [], suggestions: [] };
  }

  const data = unwrapToolData(payload) || {};
  const nestedError = payload.error && typeof payload.error === 'object' ? payload.error : {};
  const errorCode = pickFirstString(nestedError.code, payload.code, data.code);

  const reasons = dedupeFailureReasons([
    ...toArray(nestedError.reasons).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(nestedError.messages).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(nestedError.warnings).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(data.reasons).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(data.messages).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(data.warnings).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(payload.reasons).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(payload.messages).map((item) => normalizeFailureReasonItem(item, errorCode)),
    ...toArray(payload.warnings).map((item) => normalizeFailureReasonItem(item, errorCode))
  ]);
  const suggestions = unique([
    ...normalizeTextList(nestedError.suggestions),
    ...normalizeTextList(data.suggestions),
    ...normalizeTextList(payload.suggestions),
    ...normalizeTextList(data.actions),
    ...normalizeTextList(payload.actions)
  ]);

  return { reasons, suggestions };
}

function inferFailureSuggestions(errorKey, reasons = [], message = '') {
  const reasonText = toArray(reasons)
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return pickFirstString(item.detail, item.title, item.code);
      return null;
    })
    .filter(Boolean)
    .join(' ');
  const text = `${message} ${reasonText}`.toLowerCase();
  const inferred = [];

  if (/遮挡|occlusion|blocked|cover|眼.*遮|右眼|左眼/.test(text)) inferred.push('请露出双眼与完整面部');
  if (/姿态|pose|正面|侧脸|turn|yaw|pitch/.test(text)) inferred.push('请正对镜头拍摄');
  if (/裁切|crop|构图|framing|head out|头部不全|边缘/.test(text)) inferred.push('请让人脸位于画面中央并保留完整头部');
  if (/模糊|blur/.test(text)) inferred.push('请在光线充足环境下拍摄清晰照片');

  if (inferred.length > 0) return unique(inferred);
  return DEFAULT_FAILURE_SUGGESTIONS[errorKey] || DEFAULT_FAILURE_SUGGESTIONS.PROCESS_FAILED;
}

function buildFailureDetails({ error, payload, fallbackMessage, errorKey } = {}) {
  const sourcePayload = payload || error?.payload || error?.data || null;
  const details = extractFailureDetails(sourcePayload);
  const message = pickFirstString(
    fallbackMessage,
    error?.toolMessage,
    error?.message,
    sourcePayload?.message,
    sourcePayload?.error?.message
  ) || '处理失败';
  const fallbackCode = pickFirstString(error?.toolCode, sourcePayload?.error?.code, sourcePayload?.code);
  const reasons = details.reasons.length > 0
    ? details.reasons
    : [normalizeFailureReasonItem({ code: fallbackCode, title: '处理失败', detail: message }, fallbackCode)];
  const inferredKey = errorKey || inferBusinessErrorKey(error || { payload: sourcePayload }) || 'PROCESS_FAILED';
  const suggestions = details.suggestions.length > 0
    ? details.suggestions
    : inferFailureSuggestions(inferredKey, reasons, message);

  return { reasons, suggestions };
}

function inferBusinessErrorKey(error, options = {}) {
  const scenario = options.scenario || null;
  const toolCode = pickFirstString(error?.toolCode, error?.payload?.error?.code, error?.payload?.code);
  if (toolCode && TOOL_TO_BUSINESS_ERROR[toolCode]) return toolCode;

  const text = `${pickFirstString(error?.toolMessage, error?.message, error?.payload?.message, error?.payload?.error?.message) || ''}`.toLowerCase();

  if (/multiple\s+faces|more than one face|too many faces|多人脸/.test(text)) return 'MULTIPLE_FACES_DETECTED';
  if (/no face|face not detected|face not found|未检测到/.test(text)) return 'NO_FACE_DETECTED';
  if (/shoulder|neck|肩颈|肩部|脖子|upper body incomplete/.test(text)) return 'INCOMPLETE_SHOULDER_NECK';
  if (/not suitable|unsuitable|不适合换装|不适合西装|pose issue|遮挡严重|半身不完整/.test(text)) return 'UNSUITABLE_FORMAL_WEAR_IMAGE';
  if (/too small|image too small|尺寸过小/.test(text)) return 'IMAGE_TOO_SMALL';
  if (/invalid image|not a valid image|unsupported image|文件不是合法图片/.test(text)) return 'INVALID_IMAGE';
  if (/invalid|sceneid|scenekey|sizekey|background|layout|argument|source.?type|photo.?size|color|gender|style|formal/.test(text)) return 'INVALID_ARGUMENT';
  if (/formal.?wear/.test(text) && /failed|error|unsuccessful/.test(text)) return 'FORMAL_WEAR_FAILED';
  if (scenario === 'formalWear' && /failed|error while processing|generate.*failed|process.*failed/.test(text)) return 'FORMAL_WEAR_FAILED';
  if (/failed|error while processing|generate.*failed|process.*failed/.test(text)) return 'PROCESS_FAILED';
  return null;
}

function mapToolErrorToBusiness(error, options = {}) {
  if (!error) {
    return { httpStatus: 500, businessCode: 9001, message: '系统内部错误' };
  }

  if (error.type === TOOL_ERROR_TYPES.TIMEOUT) {
    return { httpStatus: 504, businessCode: 2002, message: '工具服务超时' };
  }

  if (error.type === TOOL_ERROR_TYPES.NETWORK) {
    return { httpStatus: 502, businessCode: 2001, message: '工具服务不可用' };
  }

  const inferredKey = inferBusinessErrorKey(error, options);
  if (inferredKey && TOOL_TO_BUSINESS_ERROR[inferredKey]) {
    const mapped = TOOL_TO_BUSINESS_ERROR[inferredKey];
    return {
      httpStatus: mapped.httpStatus,
      businessCode: mapped.businessCode,
      message: mapped.message
    };
  }

  if (error.type === TOOL_ERROR_TYPES.RESPONSE_ERROR) {
    return { httpStatus: 502, businessCode: 2003, message: '图像处理失败' };
  }

  return { httpStatus: 500, businessCode: 9001, message: '系统内部错误' };
}

function mapToolDetectResult(response = {}) {
  const data = unwrapToolData(response) || {};
  const detect = data.detect && typeof data.detect === 'object' ? data.detect : data;
  const faces = Array.isArray(detect.faces) ? detect.faces.length : null;
  const hasFace = normalizeBoolean(detect.hasFace ?? detect.detected ?? (faces != null ? faces > 0 : null));
  const rawFaceCount = pickFirstNumber(detect.faceCount, detect.faces, detect.faceNum, faces);
  const faceCount = rawFaceCount != null ? rawFaceCount : (hasFace === true ? 1 : 0);
  const blurScore = pickFirstNumber(detect.blurScore, detect.blur, detect.qualityScore);
  const poseValid = normalizeBoolean(detect.poseValid);
  const occlusionDetected = normalizeBoolean(detect.occlusionDetected);
  const message = pickFirstString(detect.message, data.message, response.message);
  const reasons = unique(toArray(detect.reasons || detect.warnings || detect.messages).map((item) => pickFirstString(item, item?.message)));
  const suggestions = normalizeTextList(detect.suggestions || data.suggestions || response.suggestions);

  return {
    imageId: pickFirstString(detect.imageId, detect.taskId, data.imageId, data.taskId),
    hasFace,
    faceCount,
    blurScore,
    poseValid,
    occlusionDetected,
    message,
    reasons,
    suggestions,
    pass: hasFace !== false && faceCount <= 1 && poseValid !== false && occlusionDetected !== true
  };
}

function normalizeWarnings(warnings = []) {
  return unique(toArray(warnings).map((item) => {
    if (typeof item === 'string') return item.trim();
    if (item && typeof item === 'object') return pickFirstString(item.message, item.reason, item.code, JSON.stringify(item));
    return null;
  }));
}

function normalizeQualityStatus(status) {
  const normalized = pickFirstString(status)?.toLowerCase();
  if (normalized === TOOL_QUALITY_STATUS.PASSED) return 'PASSED';
  if (normalized === TOOL_QUALITY_STATUS.WARNING) return 'WARNING';
  if (normalized === TOOL_QUALITY_STATUS.FAILED) return 'FAILED';
  return null;
}

function pickOutputPath(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object') {
      const nested = pickFirstString(value.url, value.path, value.pathname, value.outputUrl, value.outputPath);
      if (nested) return nested;
    }
  }
  return null;
}

function mapToolGenerateResult(response = {}) {
  const data = unwrapToolData(response) || {};
  const output = data.output && typeof data.output === 'object' ? data.output : {};
  const files = data.files && typeof data.files === 'object' ? data.files : {};
  const size = data.size && typeof data.size === 'object' ? data.size : {};
  const warnings = normalizeWarnings(data.warnings || output.warnings);

  return {
    taskId: pickFirstString(data.taskId, data.imageId),
    imageId: pickFirstString(data.imageId, data.taskId),
    previewUrl: pickOutputPath(
      data.previewUrl,
      data.previewPath,
      data.preview,
      output.previewUrl,
      output.previewPath,
      output.preview,
      files.preview,
      files.low,
      files.standard
    ),
    hdUrl: pickOutputPath(
      data.hdUrl,
      data.resultUrl,
      data.hdPath,
      data.outputUrl,
      data.outputPath,
      data.imageUrl,
      data.imagePath,
      output.hdUrl,
      output.resultUrl,
      output.hdPath,
      output.outputUrl,
      output.outputPath,
      output.imageUrl,
      output.imagePath,
      output.hd,
      output.result,
      files.hd,
      files.result,
      files.output,
      files.image
    ),
    printUrl: pickOutputPath(data.printUrl, output.printUrl, files.print),
    backgroundColor: pickFirstString(data.backgroundColor, output.backgroundColor),
    widthMm: pickFirstNumber(data.widthMm, size.widthMm, data.width, size.width),
    heightMm: pickFirstNumber(data.heightMm, size.heightMm, data.height, size.height),
    pixelWidth: pickFirstNumber(data.pixelWidth, data.widthPx, size.pixelWidth, size.widthPx),
    pixelHeight: pickFirstNumber(data.pixelHeight, data.heightPx, size.pixelHeight, size.heightPx),
    qualityStatus: normalizeQualityStatus(data.qualityStatus || output.qualityStatus),
    warnings,
    raw: data
  };
}

function mapToolFormalWearResult(response = {}) {
  const data = unwrapToolData(response) || {};
  const output = data.output && typeof data.output === 'object' ? data.output : {};
  const files = data.files && typeof data.files === 'object' ? data.files : {};
  const warnings = normalizeWarnings(data.warnings || output.warnings);
  const qualityStatus = normalizeQualityStatus(data.qualityStatus || output.qualityStatus) || 'PASSED';
  const qualityMessage = pickFirstString(data.qualityMessage, output.qualityMessage, data.message, response.message)
    || (qualityStatus === 'PASSED' ? '换装结果生成成功' : '请确认换装结果');

  return {
    taskId: pickFirstString(data.taskId, data.imageId),
    previewUrl: pickOutputPath(
      data.previewUrl,
      data.previewPath,
      data.preview,
      output.previewUrl,
      output.previewPath,
      output.preview,
      files.preview,
      files.low,
      files.standard
    ),
    hdUrl: pickOutputPath(
      data.hdUrl,
      data.resultUrl,
      data.outputUrl,
      data.imageUrl,
      data.hdPath,
      output.hdUrl,
      output.resultUrl,
      output.outputUrl,
      output.imageUrl,
      files.hd,
      files.result,
      files.output,
      files.image
    ),
    gender: pickFirstString(data.gender, output.gender),
    style: pickFirstString(data.style, output.style),
    color: pickFirstString(data.color, data.backgroundColor, output.color, output.backgroundColor),
    warnings,
    qualityStatus,
    qualityMessage,
    raw: data
  };
}

function buildFormalWearPayload({ storedImagePath, gender, style, color, enhance }) {
  return {
    imagePath: storedImagePath,
    gender,
    style,
    color,
    enhance: !!enhance,
    saveOutput: true
  };
}

function buildQualitySummary(detect = {}, generate = {}) {
  const messages = unique([
    ...normalizeWarnings(generate.warnings),
    ...normalizeWarnings(detect.reasons),
    detect.pass === false ? detect.message : null
  ]);

  const explicitStatus = generate.qualityStatus;
  if (explicitStatus === 'FAILED') {
    return {
      qualityStatus: 'FAILED',
      qualityMessage: messages[0] || '质量检测未通过'
    };
  }

  if (explicitStatus === 'PASSED' && detect.pass !== false && messages.length === 0) {
    return {
      qualityStatus: 'PASSED',
      qualityMessage: '质量检测通过'
    };
  }

  if (detect.pass === false || explicitStatus === 'WARNING' || messages.length > 0) {
    return {
      qualityStatus: 'WARNING',
      qualityMessage: messages.length > 0 ? messages.join('；') : '检测存在风险，请确认生成结果'
    };
  }

  return {
    qualityStatus: 'PASSED',
    qualityMessage: '质量检测通过'
  };
}

function mapToolSpecs({ colorsResponse, photoSizesResponse, fallbackSpecs }) {
  const fallback = fallbackSpecs || {};
  const colors = unique(extractColorList(colorsResponse).map(normalizeColorItem));
  const sizeDefinitions = extractPhotoSizeList(photoSizesResponse)
    .map(normalizeSizeItem)
    .filter(Boolean);

  const sizeCodes = unique(sizeDefinitions.map((item) => item.sizeCode));
  const formats = unique(sizeDefinitions.map((item) => pickFirstString(item.format)?.toLowerCase()));
  const papers = unique(sizeDefinitions.map((item) => pickFirstString(item.paper)?.toLowerCase()));

  return {
    backgroundColors: colors.length > 0 ? colors : fallback.backgroundColors,
    sizeCodes: sizeCodes.length > 0 ? sizeCodes : fallback.sizeCodes,
    papers: papers.length > 0 ? papers : fallback.papers,
    formats: formats.length > 0 ? formats : fallback.formats,
    sizeDefinitions: sizeDefinitions.length > 0 ? sizeDefinitions : (fallback.sizeDefinitions || [])
  };
}

function buildGeneratePhotoPayload({ storedImagePath, sizeCode, backgroundColor, enhance, sizeDefinition }) {
  const sourceType = pickFirstString(sizeDefinition?.sourceType, DEFAULT_SIZE_SOURCE_TYPE) || DEFAULT_SIZE_SOURCE_TYPE;
  const payload = {
    imagePath: storedImagePath,
    sizeKey: pickFirstString(sizeDefinition?.sizeCode, sizeCode),
    sceneId: sourceType === TOOL_SOURCE_TYPES.SCENE ? pickFirstString(sizeDefinition?.sceneKey) : null,
    backgroundColor,
    enhance: !!enhance,
    saveOutput: true,
    paper: pickFirstString(sizeDefinition?.paper, DEFAULT_PRINT_LAYOUT)
  };

  if (!payload.sceneId) {
    delete payload.sceneId;
  }

  if (!payload.paper) {
    delete payload.paper;
  }

  return payload;
}

module.exports = {
  mapToolErrorToBusiness,
  mapToolDetectResult,
  mapToolGenerateResult,
  mapToolFormalWearResult,
  mapToolSpecs,
  buildQualitySummary,
  buildGeneratePhotoPayload,
  buildFormalWearPayload,
  buildFailureDetails,
  inferBusinessErrorKey
};
