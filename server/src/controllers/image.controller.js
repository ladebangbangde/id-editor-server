const imageService = require('../services/image.service');
const { success } = require('../utils/api-response');

module.exports = {
  async generate(req, res) {
    const result = await imageService.generate(req.user.id, req.body);
    success(res, {
      taskId: result.task.id,
      resultId: result.imageResult.id,
      previewUrl: result.imageResult.previewUrl,
      hdUrl: result.imageResult.hdUrl,
      resultUrl: result.imageResult.resultUrl,
      printUrl: result.imageResult.printUrl,
      status: result.task.status
    });
  },

  async history(req, res) {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const result = await imageService.history(req.user.id, page, pageSize);
    success(res, { list: result.rows, total: result.count, page, pageSize });
  },

  async detail(req, res) {
    success(res, await imageService.detail(req.params.imageId, req.user.id));
  }
};
