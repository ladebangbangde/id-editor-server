const authService = require('../services/auth/auth.service');
const { success } = require('../utils/api-response');

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
      const data = await authService.wxLogin(req.body || {});
      success(res, data, 'success');
    } catch (error) {
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
