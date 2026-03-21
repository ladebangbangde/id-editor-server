const SUPPORTED_SIZE_CODES = ['one_inch', 'small_one_inch', 'two_inch'];
const SUPPORTED_BACKGROUND_COLORS = ['blue', 'white', 'red'];
const SUPPORTED_PAPERS = ['six'];
const DISPLAY_FORMATS = ['jpg', 'png'];

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return false;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function getPhotoSpecs() {
  return {
    backgroundColors: [...SUPPORTED_BACKGROUND_COLORS],
    sizeCodes: [...SUPPORTED_SIZE_CODES],
    papers: [...SUPPORTED_PAPERS],
    formats: [...DISPLAY_FORMATS],
    sizeDefinitions: SUPPORTED_SIZE_CODES.map((sizeCode) => ({
      sizeCode,
      sceneKey: sizeCode,
      sourceType: 'scene'
    }))
  };
}

function mergeSpecs(dynamicSpecs = {}) {
  const fallback = getPhotoSpecs();
  return {
    backgroundColors: unique(dynamicSpecs.backgroundColors && dynamicSpecs.backgroundColors.length ? dynamicSpecs.backgroundColors : fallback.backgroundColors),
    sizeCodes: unique(dynamicSpecs.sizeCodes && dynamicSpecs.sizeCodes.length ? dynamicSpecs.sizeCodes : fallback.sizeCodes),
    papers: unique(dynamicSpecs.papers && dynamicSpecs.papers.length ? dynamicSpecs.papers : fallback.papers),
    formats: unique(dynamicSpecs.formats && dynamicSpecs.formats.length ? dynamicSpecs.formats : fallback.formats),
    sizeDefinitions: Array.isArray(dynamicSpecs.sizeDefinitions) && dynamicSpecs.sizeDefinitions.length > 0
      ? dynamicSpecs.sizeDefinitions
      : fallback.sizeDefinitions
  };
}

function validateProcessPhotoPayload(payload = {}, file, specs = getPhotoSpecs()) {
  const normalizedSpecs = mergeSpecs(specs);

  if (!file) {
    return { valid: false, message: '文件为空', businessCode: 1001 };
  }

  if (!normalizedSpecs.sizeCodes.includes(payload.sizeCode)) {
    return { valid: false, message: '参数非法：不支持的 sizeCode', businessCode: 1006 };
  }

  if (!normalizedSpecs.backgroundColors.includes(payload.backgroundColor)) {
    return { valid: false, message: '参数非法：不支持的 backgroundColor', businessCode: 1006 };
  }

  return {
    valid: true,
    data: {
      sizeCode: payload.sizeCode,
      backgroundColor: payload.backgroundColor,
      enhance: normalizeBoolean(payload.enhance)
    },
    specs: normalizedSpecs
  };
}

module.exports = {
  SUPPORTED_SIZE_CODES,
  SUPPORTED_BACKGROUND_COLORS,
  SUPPORTED_PAPERS,
  DISPLAY_FORMATS,
  validateProcessPhotoPayload,
  getPhotoSpecs,
  mergeSpecs
};
