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

const CANONICAL_SIZE_CONFIG = {
  small_one_inch: {
    name: '小一寸',
    aliases: ['small_one_inch', 'small-1-inch', 'small1inch'],
    toolSizeKey: 'small_one_inch',
    category: 'common',
    featured: true
  },
  one_inch: {
    name: '一寸',
    aliases: ['one_inch', 'one_inch_general', '1_inch', 'oneinch'],
    toolSizeKey: 'one_inch',
    category: 'common',
    featured: true
  },
  two_inch: {
    name: '二寸',
    aliases: ['two_inch', 'two_inch_general', '2_inch', 'twoinch'],
    toolSizeKey: 'two_inch',
    category: 'common',
    featured: true
  },
  passport_photo: {
    name: '护照',
    aliases: ['passport', 'passport_photo', 'passportphoto'],
    toolSizeKey: 'passport_photo',
    category: 'passport',
    featured: true
  },
  visa_photo: {
    name: '签证照',
    aliases: ['visa', 'visa_photo', 'visaphoto'],
    toolSizeKey: 'visa_photo',
    category: 'passport',
    featured: true
  },
  driving_license: {
    name: '驾驶证',
    aliases: ['driver_license', 'driving_license', 'drivinglicense'],
    toolSizeKey: 'driving_license',
    category: 'police',
    featured: true
  },
  teacher_exam: {
    name: '教资报名照',
    aliases: ['teacher_exam', 'teacher', 'teacher_certificate'],
    toolSizeKey: null,
    category: 'job',
    featured: false
  },
  resume_photo: {
    name: '简历照',
    aliases: ['resume', 'resume_photo', 'cv', 'profile_photo'],
    toolSizeKey: null,
    category: 'common',
    featured: false
  }
};

const SCENE_KEY_TO_CANONICAL = {
  one_inch: 'one_inch',
  small_one_inch: 'small_one_inch',
  two_inch: 'two_inch',
  passport: 'passport_photo',
  visa: 'visa_photo',
  driver_license: 'driving_license',
  teacher_exam: 'teacher_exam'
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

function normalizeCode(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function findTemplateForCanonical(canonicalSizeCode) {
  const candidates = SPEC_TEMPLATES.filter((item) => SCENE_KEY_TO_CANONICAL[item.sceneKey] === canonicalSizeCode);
  if (candidates.length === 0) return null;
  return [...candidates].sort((left, right) => Number(Boolean(right.hot)) - Number(Boolean(left.hot)))[0];
}

function normalizeSizeCode(rawSizeCode) {
  const normalized = normalizeCode(rawSizeCode);
  if (!normalized) return null;

  if (CANONICAL_SIZE_CONFIG[normalized]) {
    return normalized;
  }

  for (const [canonicalCode, config] of Object.entries(CANONICAL_SIZE_CONFIG)) {
    if ((config.aliases || []).map(normalizeCode).includes(normalized)) {
      return canonicalCode;
    }
  }

  if (SCENE_KEY_TO_CANONICAL[normalized]) {
    return SCENE_KEY_TO_CANONICAL[normalized];
  }

  return null;
}

function buildCanonicalSizeDefinitions() {
  return Object.entries(CANONICAL_SIZE_CONFIG).map(([sizeCode, config]) => {
    const template = findTemplateForCanonical(sizeCode);
    return {
      sizeCode,
      name: config.name,
      aliases: unique([sizeCode, ...(config.aliases || [])]),
      widthMm: template?.widthMm || null,
      heightMm: template?.heightMm || null,
      pixelWidth: template?.pixelWidth || null,
      pixelHeight: template?.pixelHeight || null,
      category: config.category,
      featured: Boolean(config.featured),
      toolSizeKey: config.toolSizeKey || null,
      allowCustom: false,
      customRange: null,
      supportedBackgroundColors: template
        ? unique((template.backgroundOptions || []).map((item) => String(item || '').replace('底', '').trim().toLowerCase()))
        : [...SUPPORTED_BACKGROUND_COLORS],
      toolSupported: Boolean(config.toolSizeKey)
    };
  });
}

function buildCategorySizeMap(sizeDefinitions) {
  return SPEC_CATEGORIES.map((category) => ({
    key: category.key,
    name: category.name,
    sort: category.sort,
    sizeCodes: unique(sizeDefinitions.filter((item) => item.category === category.key).map((item) => item.sizeCode))
  })).filter((item) => item.sizeCodes.length > 0);
}

function listUnsupportedTemplateKeys() {
  return unique(SPEC_TEMPLATES
    .map((item) => item.sceneKey)
    .filter((sceneKey) => !normalizeSizeCode(sceneKey)));
}


function getSupportedCanonicalSizeCodes(definitions = null) {
  const items = definitions || buildCanonicalSizeDefinitions();
  return items.filter((item) => item.toolSupported).map((item) => item.sizeCode);
}

function resolveSizeCode(rawSizeCode, specs = null) {
  const originalRequestedSizeKey = rawSizeCode;
  const normalizedSizeCode = normalizeSizeCode(rawSizeCode);
  const definitions = specs?.sizeDefinitions || buildCanonicalSizeDefinitions();

  if (!normalizedSizeCode) {
    return {
      ok: false,
      originalRequestedSizeKey,
      normalizedSizeCode: null,
      reason: 'UNRECOGNIZED_SIZE_CODE',
      message: `参数非法：无法识别的 sizeCode（可用：${getSupportedCanonicalSizeCodes(definitions).join('、')}）`
    };
  }

  const matchedDefinition = definitions.find((item) => item.sizeCode === normalizedSizeCode) || null;
  if (!matchedDefinition) {
    return {
      ok: false,
      originalRequestedSizeKey,
      normalizedSizeCode,
      reason: 'SIZE_CODE_NOT_CONFIGURED',
      message: '参数非法：sizeCode 未配置'
    };
  }

  if (!matchedDefinition.toolSizeKey) {
    return {
      ok: false,
      originalRequestedSizeKey,
      normalizedSizeCode,
      reason: 'SIZE_CODE_NOT_SUPPORTED_BY_TOOL',
      message: `当前尺寸暂不支持自动生成：${matchedDefinition.name || normalizedSizeCode}，请改用 ${getSupportedCanonicalSizeCodes(definitions).join('、')}`,
      definition: matchedDefinition
    };
  }

  return {
    ok: true,
    originalRequestedSizeKey,
    normalizedSizeCode,
    toolSizeKey: matchedDefinition.toolSizeKey,
    definition: matchedDefinition
  };
}

function getPhotoSpecs() {
  const sizeDefinitions = buildCanonicalSizeDefinitions();

  return {
    backgroundColors: [...SUPPORTED_BACKGROUND_COLORS],
    sizeCodes: sizeDefinitions.map((item) => item.sizeCode),
    papers: [...SUPPORTED_PAPERS],
    formats: [...DISPLAY_FORMATS],
    sizeDefinitions,
    popularSizeCodes: sizeDefinitions.filter((item) => item.featured).map((item) => item.sizeCode),
    categorizedSizes: buildCategorySizeMap(sizeDefinitions),
    customSizeRules: CUSTOM_SIZE_RULES,
    recommended: {
      sizeCodes: ['one_inch', 'two_inch', 'small_one_inch'],
      backgroundColors: ['white', 'blue']
    },
    unsupportedTemplateSceneKeys: listUnsupportedTemplateKeys()
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
      : fallback.sizeDefinitions,
    popularSizeCodes: unique(dynamicSpecs.popularSizeCodes && dynamicSpecs.popularSizeCodes.length ? dynamicSpecs.popularSizeCodes : fallback.popularSizeCodes),
    categorizedSizes: Array.isArray(dynamicSpecs.categorizedSizes) && dynamicSpecs.categorizedSizes.length > 0
      ? dynamicSpecs.categorizedSizes
      : fallback.categorizedSizes,
    customSizeRules: dynamicSpecs.customSizeRules || fallback.customSizeRules,
    recommended: dynamicSpecs.recommended || fallback.recommended,
    unsupportedTemplateSceneKeys: unique(dynamicSpecs.unsupportedTemplateSceneKeys || fallback.unsupportedTemplateSceneKeys)
  };
}

function validateProcessPhotoPayload(payload = {}, file, specs = getPhotoSpecs()) {
  const normalizedSpecs = mergeSpecs(specs);

  if (!file) {
    return { valid: false, message: '文件为空', businessCode: 1001 };
  }

  const resolvedSize = resolveSizeCode(payload.sizeCode, normalizedSpecs);
  if (!resolvedSize.ok) {
    return {
      valid: false,
      message: resolvedSize.message,
      businessCode: 1006,
      data: {
        originalRequestedSizeKey: resolvedSize.originalRequestedSizeKey,
        normalizedSizeCode: resolvedSize.normalizedSizeCode
      }
    };
  }

  if (!normalizedSpecs.backgroundColors.includes(payload.backgroundColor)) {
    return { valid: false, message: '参数非法：不支持的 backgroundColor', businessCode: 1006 };
  }

  return {
    valid: true,
    data: {
      originalRequestedSizeKey: resolvedSize.originalRequestedSizeKey,
      normalizedSizeCode: resolvedSize.normalizedSizeCode,
      toolSizeKey: resolvedSize.toolSizeKey,
      sizeCode: resolvedSize.normalizedSizeCode,
      backgroundColor: payload.backgroundColor,
      enhance: normalizeBoolean(payload.enhance)
    },
    specs: normalizedSpecs,
    resolvedSize
  };
}

module.exports = {
  SUPPORTED_BACKGROUND_COLORS,
  SUPPORTED_PAPERS,
  DISPLAY_FORMATS,
  CUSTOM_SIZE_RULES,
  normalizeSizeCode,
  resolveSizeCode,
  getSupportedCanonicalSizeCodes,
  validateProcessPhotoPayload,
  getPhotoSpecs,
  mergeSpecs
};
