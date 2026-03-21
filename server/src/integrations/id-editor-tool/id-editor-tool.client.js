const fs = require('fs/promises');
const path = require('path');
const { File } = require('node:buffer');
const appConfig = require('../../config/app.config');
const logger = require('../../utils/logger');
const { IdEditorToolError, TOOL_ERROR_TYPES } = require('./id-editor-tool.types');

class IdEditorToolClient {
  constructor() {
    this.baseUrl = String(appConfig.idEditorToolBaseUrl || '').replace(/\/$/, '');
    this.publicBaseUrl = String(appConfig.idEditorToolPublicBaseUrl || this.baseUrl).replace(/\/$/, '');
    this.timeout = Number(appConfig.idEditorToolTimeout || 30000);
  }

  async healthCheck() {
    return this.request('/health', { method: 'GET' });
  }

  async detectPhoto(file) {
    const formData = await this.createFileFormData(file);
    return this.request('/detect', { method: 'POST', body: formData });
  }

  async generatePhoto(file, options = {}) {
    const formData = await this.createFileFormData(file);
    if (options.sceneId) formData.append('sceneId', String(options.sceneId));
    if (options.sizeKey) formData.append('sizeKey', String(options.sizeKey));
    if (options.backgroundColor) formData.append('backgroundColor', String(options.backgroundColor));
    if (typeof options.enhance === 'boolean') formData.append('enhance', String(options.enhance));
    if (typeof options.saveOutput === 'boolean') formData.append('saveOutput', String(options.saveOutput));
    return this.request('/generate', { method: 'POST', body: formData });
  }

  createAbsoluteOutputUrl(relativePath) {
    if (!relativePath) return null;
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    return new URL(relativePath.startsWith('/') ? relativePath : `/${relativePath}`, `${this.publicBaseUrl}/`).toString();
  }

  async createFileFormData(file) {
    const formData = new FormData();
    const fileBuffer = await fs.readFile(file.path);
    const uploadFile = new File([fileBuffer], file.originalname || path.basename(file.path), {
      type: file.mimetype || 'application/octet-stream'
    });
    formData.append('file', uploadFile);
    return formData;
  }

  async request(requestPath, { method = 'GET', body } = {}) {
    const controller = new AbortController();
    const requestUrl = `${this.baseUrl}${requestPath}`;
    const startedAt = Date.now();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(requestUrl, {
        method,
        body,
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
          message: error.message
        });
        throw error;
      }

      if (error.name === 'AbortError') {
        logger.error('id-editor-tool timeout', { path: requestPath, method, durationMs, timeout: this.timeout });
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
