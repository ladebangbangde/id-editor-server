const photoService = require('./photo.service');
const { success } = require('../../utils/api-response');
const logger = require('../../utils/logger');

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
    logger.info('photo process request payload received', {
      userId: req.user?.id || null,
      requestBody: req.body || {},
      receivedFile: req.file
        ? {
            fieldName: req.file.fieldname || null,
            originalName: req.file.originalname || null,
            mimeType: req.file.mimetype || null,
            size: req.file.size || null
          }
        : null
    });
    const result = await photoService.processPhoto({
      user: req.user,
      file: req.file,
      payload: req.body
    });
    logger.info('photo api response candidates', {
      api: 'process',
      taskId: result.taskId,
      candidates: Array.isArray(result.candidates)
        ? result.candidates.map((candidate) => ({
            candidateId: candidate.candidateId || null,
            source: candidate.source || null,
            engine: candidate.engine || null,
            previewUrl: candidate.previewUrl || null,
            hdUrl: candidate.hdUrl || null
          }))
        : []
    });

    return success(res, result, 'success');
  }),


  createTask: asyncHandler(async (req, res) => {
    const result = await photoService.createPhotoTask({
      user: req.user,
      file: req.file,
      payload: req.body
    });
    return success(res, result, 'success');
  }),

  history: asyncHandler(async (req, res) => {
    const result = await photoService.getPhotoHistory(req.user, req.query);
    return success(res, result, 'success');
  }),


  taskStatus: asyncHandler(async (req, res) => {
    const result = await photoService.getTaskStatus(req.params.taskId, req.user.id);
    return success(res, result, 'success');
  }),

  taskResult: asyncHandler(async (req, res) => {
    const result = await photoService.getTaskResult(req.params.taskId, req.user.id);
    return success(res, result, 'success');
  }),

  taskDetail: asyncHandler(async (req, res) => {
    const result = await photoService.getTaskDetail(req.params.taskId, req.user.id);
    logger.info('photo api response candidates', {
      api: 'taskDetail',
      taskId: result.taskId,
      candidates: Array.isArray(result.candidates)
        ? result.candidates.map((candidate) => ({
            candidateId: candidate.candidateId || null,
            source: candidate.source || null,
            engine: candidate.engine || null,
            previewUrl: candidate.previewUrl || null,
            hdUrl: candidate.hdUrl || null
          }))
        : []
    });
    return success(res, result, 'success');
  }),

  editDraft: asyncHandler(async (req, res) => {
    const result = await photoService.getTaskEditDraft(req.params.taskId, req.user.id);
    return success(res, result, 'success');
  })
};
