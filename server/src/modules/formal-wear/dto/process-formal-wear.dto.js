const ALLOWED_GENDERS = ['male', 'female'];
const ALLOWED_STYLES = ['standard', 'business', 'simple'];
const ALLOWED_COLORS = ['black', 'navy', 'gray'];

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseEnhance(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', ''].includes(normalized)) return false;
  }
  return null;
}

function validateFormalWearPayload(payload = {}, file) {
  if (!file) {
    return { valid: false, message: '请上传待换装图片', businessCode: 1001 };
  }

  const gender = normalizeString(payload.gender).toLowerCase();
  if (!ALLOWED_GENDERS.includes(gender)) {
    return { valid: false, message: 'gender 参数非法', businessCode: 1101 };
  }

  const style = normalizeString(payload.style).toLowerCase();
  if (!ALLOWED_STYLES.includes(style)) {
    return { valid: false, message: 'style 参数非法', businessCode: 1102 };
  }

  const color = normalizeString(payload.color).toLowerCase();
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
