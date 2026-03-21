const { TOOL_ERROR_TYPES, TOOL_QUALITY_STATUS, TOOL_SOURCE_TYPES } = require('./id-editor-tool.types');

const TOOL_TO_BUSINESS_ERROR = {
  INVALID_IMAGE: { httpStatus: 400, businessCode: 1002, message: '文件不是合法图片' },
  NO_FACE_DETECTED: { httpStatus: 400, businessCode: 1004, message: '未检测到有效人像' },
  MULTIPLE_FACES_DETECTED: { httpStatus: 400, businessCode: 1005, message: '检测到多个人像' },
  IMAGE_TOO_SMALL: { httpStatus: 400, businessCode: 1003, message: '图片尺寸过小' },
  INVALID_ARGUMENT: { httpStatus: 400, businessCode: 1006, message: '参数非法' },
  PROCESS_FAILED: { httpStatus: 502, businessCode: 2003, message: '图像处理失败' }
};

const DEFAULT_SIZE_SOURCE_TYPE = TOOL_SOURCE_TYPES.SCENE;
const DEFAULT_PRINT_LAYOUT = 'six';

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

function inferBusinessErrorKey(error) {
  const toolCode = pickFirstString(error?.toolCode, error?.payload?.error?.code, error?.payload?.code);
  if (toolCode && TOOL_TO_BUSINESS_ERROR[toolCode]) return toolCode;

  const text = `${pickFirstString(error?.toolMessage, error?.message, error?.payload?.message, error?.payload?.error?.message) || ''}`.toLowerCase();

  if (/multiple\s+faces|more than one face|too many faces/.test(text)) return 'MULTIPLE_FACES_DETECTED';
  if (/no face|face not detected|face not found|未检测到/.test(text)) return 'NO_FACE_DETECTED';
  if (/too small|image too small|尺寸过小/.test(text)) return 'IMAGE_TOO_SMALL';
  if (/invalid image|not a valid image|unsupported image|文件不是合法图片/.test(text)) return 'INVALID_IMAGE';
  if (/invalid|sceneid|scenekey|sizekey|background|layout|argument|source.?type|photo.?size|color/.test(text)) return 'INVALID_ARGUMENT';
  if (/failed|error while processing|generate.*failed|process.*failed/.test(text)) return 'PROCESS_FAILED';
  return null;
}

function mapToolErrorToBusiness(error) {
  if (!error) {
    return { httpStatus: 500, businessCode: 9001, message: '系统内部错误' };
  }

  if (error.type === TOOL_ERROR_TYPES.TIMEOUT) {
    return { httpStatus: 504, businessCode: 2002, message: '工具服务超时' };
  }

  if (error.type === TOOL_ERROR_TYPES.NETWORK) {
    return { httpStatus: 502, businessCode: 2001, message: '工具服务不可用' };
  }

  const inferredKey = inferBusinessErrorKey(error);
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

  return {
    imageId: pickFirstString(detect.imageId, detect.taskId, data.imageId, data.taskId),
    hasFace,
    faceCount,
    blurScore,
    poseValid,
    occlusionDetected,
    message,
    reasons,
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
  mapToolSpecs,
  buildQualitySummary,
  buildGeneratePhotoPayload
};
