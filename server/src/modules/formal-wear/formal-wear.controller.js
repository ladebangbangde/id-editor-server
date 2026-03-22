const formalWearService = require('./formal-wear.service');
const { success } = require('../../utils/api-response');

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

function pickUploadedFile(req) {
  if (req.file) return req.file;

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) return null;

  const preferredFields = ['file', 'image', 'photo', 'source', 'sourceFile', 'originFile'];
  for (const fieldName of preferredFields) {
    const matched = files.find((item) => item && item.fieldname === fieldName);
    if (matched) return matched;
  }

  return files[0] || null;
}

const handleCreateTask = asyncHandler(async (req, res) => {
  const result = await formalWearService.processFormalWear({
    user: req.user,
    file: pickUploadedFile(req),
    payload: req.body
  });

  return success(res, result, 'success');
});

module.exports = {
  createTask: handleCreateTask,

  process: handleCreateTask,

  history: asyncHandler(async (req, res) => {
    const result = await formalWearService.getFormalWearHistory(req.user.id, req.query);
    return success(res, result, 'success');
  }),

  taskDetail: asyncHandler(async (req, res) => {
    const result = await formalWearService.getTaskDetail(req.params.taskId, req.user.id);
    return success(res, result, 'success');
  })
};
