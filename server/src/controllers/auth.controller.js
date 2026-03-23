const authService = require('../services/auth/auth.service');
const { success } = require('../utils/api-response');
const logger = require('../utils/logger');

module.exports = {
  async me(req, res, next) {
    try {
      const data = await authService.me(req.user);
      success(res, data, 'success');
    } catch (error) {
      next(error);
    }
  },

  async wxLogin(req, res, next) {
    try {
      logger.info('wx-login request received', {
        path: req.originalUrl,
        body: req.body || {},
        hasCode: Boolean(req.body && req.body.code && String(req.body.code).trim())
      });
      const data = await authService.wxLogin(req.body || {});
      success(res, data, 'success');
    } catch (error) {
      logger.warn('wx-login request failed', {
        path: req.originalUrl,
        statusCode: error.statusCode || 500,
        businessCode: error.businessCode || null,
        message: error.message || 'Internal Server Error',
        body: req.body || {},
        hasCode: Boolean(req.body && req.body.code && String(req.body.code).trim())
      });
      next(error);
    }
  },

  async adminLogin(req, res, next) {
    try {
      const data = await authService.adminLogin(req.body || {});
      success(res, data, 'success');
    } catch (error) {
      next(error);
    }
  }
};
