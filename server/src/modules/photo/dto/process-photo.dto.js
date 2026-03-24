const { SPEC_CATEGORIES, SPEC_TEMPLATES } = require('../../../constants/spec-data');

const SUPPORTED_BACKGROUND_COLORS = ['blue', 'white', 'red'];
const SUPPORTED_PAPERS = ['six'];
const DISPLAY_FORMATS = ['jpg', 'png'];

const CUSTOM_SIZE_RULES = {
  widthMm: { min: 16, max: 80 },
  heightMm: { min: 16, max: 120 },
  pixelWidth: { min: 200, max: 2000 },
  pixelHeight: { min: 260, max: 3000 }
};

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

function resolveTemplates() {
  return SPEC_TEMPLATES.map((template) => ({
    sizeCode: template.sceneKey,
    sceneKey: template.sceneKey,
    sourceType: 'scene',
    name: template.name,
    widthMm: template.widthMm,
    heightMm: template.heightMm,
    pixelWidth: template.pixelWidth,
    pixelHeight: template.pixelHeight,
    paper: 'six',
    format: 'jpg',
    backgroundColors: (template.backgroundOptions || [])
      .map((item) => String(item || '').replace('底', '').trim().toLowerCase())
      .filter(Boolean),
    category: template.category,
    hot: Boolean(template.hot),
    sort: template.sort
  }));
}

function buildCategorySizeMap(sizeDefinitions) {
  return SPEC_CATEGORIES.map((category) => ({
    key: category.key,
    name: category.name,
    sort: category.sort,
    sizeCodes: unique(
      sizeDefinitions
        .filter((item) => item.category === category.key)
        .map((item) => item.sizeCode)
    )
  })).filter((category) => category.sizeCodes.length > 0);
}

function getPhotoSpecs() {
  const sizeDefinitions = resolveTemplates();

  return {
    backgroundColors: [...SUPPORTED_BACKGROUND_COLORS],
    sizeCodes: unique(sizeDefinitions.map((item) => item.sizeCode)),
    papers: [...SUPPORTED_PAPERS],
    formats: [...DISPLAY_FORMATS],
    sizeDefinitions,
    popularSizeCodes: unique(sizeDefinitions.filter((item) => item.hot).map((item) => item.sizeCode)),
    categorizedSizes: buildCategorySizeMap(sizeDefinitions),
    customSizeRules: CUSTOM_SIZE_RULES,
    recommended: {
      sizeCodes: ['one_inch', 'two_inch', 'small_one_inch'],
      backgroundColors: ['white', 'blue']
    }
  };
}

function mergeSpecs(dynamicSpecs = {}) {
  const fallback = getPhotoSpecs();
  const sizeDefinitions = Array.isArray(dynamicSpecs.sizeDefinitions) && dynamicSpecs.sizeDefinitions.length > 0
    ? dynamicSpecs.sizeDefinitions
    : fallback.sizeDefinitions;

  return {
    backgroundColors: unique(dynamicSpecs.backgroundColors && dynamicSpecs.backgroundColors.length ? dynamicSpecs.backgroundColors : fallback.backgroundColors),
    sizeCodes: unique(dynamicSpecs.sizeCodes && dynamicSpecs.sizeCodes.length ? dynamicSpecs.sizeCodes : fallback.sizeCodes),
    papers: unique(dynamicSpecs.papers && dynamicSpecs.papers.length ? dynamicSpecs.papers : fallback.papers),
    formats: unique(dynamicSpecs.formats && dynamicSpecs.formats.length ? dynamicSpecs.formats : fallback.formats),
    sizeDefinitions,
    popularSizeCodes: unique(dynamicSpecs.popularSizeCodes && dynamicSpecs.popularSizeCodes.length ? dynamicSpecs.popularSizeCodes : fallback.popularSizeCodes),
    categorizedSizes: Array.isArray(dynamicSpecs.categorizedSizes) && dynamicSpecs.categorizedSizes.length > 0
      ? dynamicSpecs.categorizedSizes
      : fallback.categorizedSizes,
    customSizeRules: dynamicSpecs.customSizeRules || fallback.customSizeRules,
    recommended: dynamicSpecs.recommended || fallback.recommended
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
  SUPPORTED_BACKGROUND_COLORS,
  SUPPORTED_PAPERS,
  DISPLAY_FORMATS,
  CUSTOM_SIZE_RULES,
  validateProcessPhotoPayload,
  getPhotoSpecs,
  mergeSpecs
};
