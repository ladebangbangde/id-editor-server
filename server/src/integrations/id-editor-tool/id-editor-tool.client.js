const appConfig = require('../../config/app.config');
const logger = require('../../utils/logger');
const { IdEditorToolError, TOOL_ERROR_TYPES } = require('./id-editor-tool.types');

function isFormDataBody(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function appendFormValue(form, key, value) {
  if (value === undefined || value === null || value === '') return;

  if (Array.isArray(value)) {
    value.forEach((item) => appendFormValue(form, key, item));
    return;
  }

  if (typeof value === 'boolean') {
    form.append(key, value ? 'true' : 'false');
    return;
  }

  form.append(key, String(value));
}

function buildFormData(payload = {}) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => appendFormValue(form, key, value));
  return form;
}

class IdEditorToolClient {
  constructor() {
    this.baseUrl = String(appConfig.idEditorToolBaseUrl || '').replace(/\/$/, '');
    this.publicBaseUrl = String(appConfig.idEditorToolPublicBaseUrl || this.baseUrl).replace(/\/$/, '');
    this.timeout = Number(appConfig.idEditorToolTimeout || 30000);
  }

  async healthCheck() {
    return this.request('/health', { method: 'GET' });
  }

  async detectPhoto(payload) {
    return this.request('/detect', {
      method: 'POST',
      body: buildFormData(payload)
    });
  }

  async generatePhoto(payload) {
    return this.request('/generate', {
      method: 'POST',
      body: buildFormData(payload)
    });
  }
  async generatePrintLayout(payload) {
    return this.request('/layout', {
      method: 'POST',
      body: buildFormData(payload)
    });
  }

  createAbsoluteOutputUrl(relativePath) {
    if (!relativePath) return null;
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    return new URL(relativePath.startsWith('/') ? relativePath : `/${relativePath}`, `${this.publicBaseUrl}/`).toString();
  }

  async request(requestPath, { method = 'GET', body } = {}) {
    const controller = new AbortController();
    const requestUrl = `${this.baseUrl}${requestPath}`;
    const startedAt = Date.now();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const headers = {
      Accept: 'application/json'
    };

    let requestBody;
    if (body !== undefined && body !== null) {
      if (isFormDataBody(body)) {
        requestBody = body;
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(requestUrl, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal
      });

      const rawText = await response.text();
      let payload = null;
      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch (_error) {
          payload = { success: false, message: rawText };
        }
      }
      const durationMs = Date.now() - startedAt;

      logger.info('id-editor-tool request completed', {
        path: requestPath,
        method,
        status: response.status,
        durationMs
      });

      if (!response.ok || payload?.success === false) {
        const toolCode = payload?.error?.code || payload?.code || null;
        const toolMessage = payload?.error?.message || payload?.message || `Tool request failed: ${response.status}`;
        throw new IdEditorToolError(toolMessage, {
          type: TOOL_ERROR_TYPES.RESPONSE_ERROR,
          toolCode,
          toolMessage,
          httpStatus: response.status,
          payload
        });
      }

      return payload;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      if (error instanceof IdEditorToolError) {
        logger.warn('id-editor-tool response error', {
          path: requestPath,
          method,
          durationMs,
          toolCode: error.toolCode,
          message: error.message,
          payload: error.payload || null
        });
        throw error;
      }

      if (error.name === 'AbortError') {
        logger.error('id-editor-tool timeout', {
          path: requestPath,
          method,
          durationMs,
          timeout: this.timeout
        });
        throw new IdEditorToolError('工具服务超时', {
          type: TOOL_ERROR_TYPES.TIMEOUT,
          toolMessage: '工具服务超时',
          cause: error
        });
      }

      logger.error('id-editor-tool network failure', {
        path: requestPath,
        method,
        durationMs,
        error: error.message
      });
      throw new IdEditorToolError('工具服务不可用', {
        type: TOOL_ERROR_TYPES.NETWORK,
        toolMessage: '工具服务不可用',
        cause: error
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

module.exports = new IdEditorToolClient();
