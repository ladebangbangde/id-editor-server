const formalWearService = require('./formal-wear.service');
const { success } = require('../../utils/api-response');

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  process: asyncHandler(async (req, res) => {
    const result = await formalWearService.processFormalWear({
      user: req.user,
      file: req.file,
      payload: req.body
    });

    return success(res, result, 'success');
  }),

  history: asyncHandler(async (req, res) => {
    const result = await formalWearService.getFormalWearHistory(req.user.id, req.query);
    return success(res, result, 'success');
  }),

  taskDetail: asyncHandler(async (req, res) => {
    const result = await formalWearService.getTaskDetail(req.params.taskId, req.user.id);
    return success(res, result, 'success');
  })
};
