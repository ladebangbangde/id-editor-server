const photoService = require('./photo.service');
const { success } = require('../../utils/api-response');

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  specs: asyncHandler(async (_req, res) => {
    const result = await photoService.getSpecs();
    return success(res, result, 'success');
  }),

  process: asyncHandler(async (req, res) => {
    const result = await photoService.processPhoto({
      user: req.user,
      file: req.file,
      payload: req.body
    });

    return success(res, result, 'success');
  }),

  taskDetail: asyncHandler(async (req, res) => {
    const result = await photoService.getTaskDetail(req.params.taskId, req.user.id);
    return success(res, result, 'success');
  })
};
