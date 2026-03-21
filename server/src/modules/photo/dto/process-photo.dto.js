const SUPPORTED_SIZE_CODES = ['one_inch', 'small_one_inch', 'two_inch'];
const SUPPORTED_BACKGROUND_COLORS = ['blue', 'white', 'red'];
const SUPPORTED_PAPERS = ['6inch'];
const DISPLAY_FORMATS = ['jpg', 'png'];

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return false;
}

function validateProcessPhotoPayload(payload = {}, file) {
  if (!file) {
    return { valid: false, message: '文件为空', businessCode: 1001 };
  }

  if (!SUPPORTED_SIZE_CODES.includes(payload.sizeCode)) {
    return { valid: false, message: '参数非法：不支持的 sizeCode', businessCode: 1006 };
  }

  if (!SUPPORTED_BACKGROUND_COLORS.includes(payload.backgroundColor)) {
    return { valid: false, message: '参数非法：不支持的 backgroundColor', businessCode: 1006 };
  }

  return {
    valid: true,
    data: {
      sizeCode: payload.sizeCode,
      backgroundColor: payload.backgroundColor,
      enhance: normalizeBoolean(payload.enhance)
    }
  };
}

function getPhotoSpecs() {
  return {
    backgroundColors: SUPPORTED_BACKGROUND_COLORS,
    sizeCodes: SUPPORTED_SIZE_CODES,
    papers: SUPPORTED_PAPERS,
    formats: DISPLAY_FORMATS
  };
}

module.exports = {
  SUPPORTED_SIZE_CODES,
  SUPPORTED_BACKGROUND_COLORS,
  SUPPORTED_PAPERS,
  DISPLAY_FORMATS,
  validateProcessPhotoPayload,
  getPhotoSpecs
};
