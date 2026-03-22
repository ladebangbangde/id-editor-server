const ALLOWED_GENDERS = ['male', 'female'];
const ALLOWED_STYLES = ['standard', 'business', 'simple'];
const ALLOWED_COLORS = ['black', 'navy', 'gray'];

const GENDER_ALIASES = {
  male: 'male',
  man: 'male',
  boy: 'male',
  m: 'male',
  '1': 'male',
  男: 'male',
  女性: 'female',
  female: 'female',
  woman: 'female',
  girl: 'female',
  f: 'female',
  '0': 'female',
  '2': 'female',
  女: 'female'
};

const STYLE_ALIASES = {
  standard: 'standard',
  default: 'standard',
  normal: 'standard',
  formal: 'standard',
  正式: 'standard',
  标准: 'standard',
  business: 'business',
  professional: 'business',
  office: 'business',
  商务: 'business',
  simple: 'simple',
  basic: 'simple',
  lite: 'simple',
  minimal: 'simple',
  简约: 'simple',
  简洁: 'simple'
};

const COLOR_ALIASES = {
  black: 'black',
  dark: 'black',
  darkblack: 'black',
  黑: 'black',
  黑色: 'black',
  navy: 'navy',
  navyblue: 'navy',
  darkblue: 'navy',
  blue: 'navy',
  藏蓝: 'navy',
  深蓝: 'navy',
  深蓝色: 'navy',
  gray: 'gray',
  grey: 'gray',
  灰: 'gray',
  灰色: 'gray'
};

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEnumValue(value, aliases = {}) {
  const normalized = normalizeString(value).toLowerCase().replace(/[-_\s]/g, '');
  if (!normalized) return null;
  return aliases[normalized] || null;
}

function parseEnhance(value) {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off', ''].includes(normalized)) return false;
  }
  return null;
}

function validateFormalWearPayload(payload = {}, file) {
  if (!file) {
    return { valid: false, message: '请上传待换装图片', businessCode: 1001 };
  }

  const gender = normalizeEnumValue(payload.gender, GENDER_ALIASES);
  if (!ALLOWED_GENDERS.includes(gender)) {
    return { valid: false, message: 'gender 参数非法', businessCode: 1101 };
  }

  const style = normalizeEnumValue(payload.style, STYLE_ALIASES);
  if (!ALLOWED_STYLES.includes(style)) {
    return { valid: false, message: 'style 参数非法', businessCode: 1102 };
  }

  const color = normalizeEnumValue(payload.color, COLOR_ALIASES);
  if (!ALLOWED_COLORS.includes(color)) {
    return { valid: false, message: 'color 参数非法', businessCode: 1103 };
  }

  const enhance = parseEnhance(payload.enhance);
  if (enhance === null) {
    return { valid: false, message: 'enhance 参数非法', businessCode: 1104 };
  }

  return {
    valid: true,
    data: {
      gender,
      style,
      color,
      enhance
    }
  };
}

module.exports = {
  ALLOWED_GENDERS,
  ALLOWED_STYLES,
  ALLOWED_COLORS,
  validateFormalWearPayload
};
