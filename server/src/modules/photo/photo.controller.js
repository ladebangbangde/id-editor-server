const photoService = require('./photo.service');
const { success } = require('../../utils/api-response');

module.exports = {
  specs(_req, res) {
    return success(res, photoService.getSpecs(), 'success');
  },

  async process(req, res) {
    const result = await photoService.processPhoto({
      user: req.user,
      file: req.file,
      payload: req.body
    });

    return success(res, result, 'success');
  },

  async taskDetail(req, res) {
    const result = await photoService.getTaskDetail(req.params.taskId, req.user.id);
    return success(res, result, 'success');
  }
};
