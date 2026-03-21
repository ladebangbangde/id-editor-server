const { TOOL_ERROR_TYPES } = require('./id-editor-tool.types');

const TOOL_TO_BUSINESS_ERROR = {
  INVALID_IMAGE: { httpStatus: 400, businessCode: 1002, message: '文件不是合法图片' },
  NO_FACE_DETECTED: { httpStatus: 400, businessCode: 1004, message: '未检测到有效人像' },
  MULTIPLE_FACES_DETECTED: { httpStatus: 400, businessCode: 1005, message: '检测到多个人像' },
  IMAGE_TOO_SMALL: { httpStatus: 400, businessCode: 1003, message: '图片尺寸过小' },
  INVALID_ARGUMENT: { httpStatus: 400, businessCode: 1006, message: '参数非法' },
  PROCESS_FAILED: { httpStatus: 502, businessCode: 2003, message: '图像处理失败' }
};

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

  if (error.toolCode && TOOL_TO_BUSINESS_ERROR[error.toolCode]) {
    const mapped = TOOL_TO_BUSINESS_ERROR[error.toolCode];
    return {
      httpStatus: mapped.httpStatus,
      businessCode: mapped.businessCode,
      message: error.toolMessage || mapped.message
    };
  }

  if (error.type === TOOL_ERROR_TYPES.RESPONSE_ERROR) {
    return { httpStatus: 502, businessCode: 2003, message: error.toolMessage || '图像处理失败' };
  }

  return { httpStatus: 500, businessCode: 9001, message: '系统内部错误' };
}

function buildQualitySummary(detect = {}, warnings = []) {
  const normalizedWarnings = Array.isArray(warnings) ? warnings.filter(Boolean) : [];
  const detectReasons = Array.isArray(detect.reasons) ? detect.reasons.filter(Boolean) : [];

  if (detect.pass === true && normalizedWarnings.length === 0) {
    return {
      qualityStatus: 'PASSED',
      qualityMessage: '质量检测通过'
    };
  }

  const messages = [...detectReasons, ...normalizedWarnings];
  return {
    qualityStatus: 'WARNING',
    qualityMessage: messages.length > 0 ? messages.join('；') : '检测存在风险，请确认生成结果'
  };
}

module.exports = {
  mapToolErrorToBusiness,
  buildQualitySummary
};
