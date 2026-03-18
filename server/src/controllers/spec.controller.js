const specService = require('../services/spec.service');
const { success } = require('../utils/api-response');

module.exports = {
  async categories(req, res) {
    success(res, await specService.categories(), 'ok');
  },

  async list(req, res) {
    success(res, await specService.list(req.query), 'ok');
  },

  async detail(req, res) {
    success(res, await specService.detail(req.params.id), 'ok');
  }
};
