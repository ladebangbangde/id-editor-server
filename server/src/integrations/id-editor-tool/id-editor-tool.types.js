const TOOL_ERROR_TYPES = {
  RESPONSE_ERROR: 'RESPONSE_ERROR',
  TIMEOUT: 'TIMEOUT',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN'
};

class IdEditorToolError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'IdEditorToolError';
    this.type = options.type || TOOL_ERROR_TYPES.UNKNOWN;
    this.toolCode = options.toolCode || null;
    this.toolMessage = options.toolMessage || message;
    this.httpStatus = options.httpStatus || null;
    this.payload = options.payload || null;
    this.cause = options.cause;
  }
}

module.exports = {
  TOOL_ERROR_TYPES,
  IdEditorToolError
};
