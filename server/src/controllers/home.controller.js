const homeService = require('../services/home.service');
const { success } = require('../utils/api-response');

module.exports = {
  async config(req, res) {
    success(res, homeService.config(), 'ok');
  },

  async templates(req, res) {
    success(res, await homeService.templates(req.query.category), 'ok');
  }
};
