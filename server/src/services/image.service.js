const AppError = require('../utils/app-error');
const { mmToPx } = require('../utils/image-helper');
const { Image, ImageTask, ImageResult, SceneTemplate } = require('../models');
const { TASK_STATUS } = require('../constants/status');
const generateIdPhoto = require('./image-pipeline/generate-id-photo');
const generatePrintLayout = require('./image-pipeline/generate-print-layout');

module.exports = {
  async generate(userId, payload) {
    const image = await Image.findByPk(payload.imageId);
    if (!image || image.user_id !== userId) throw new AppError('Image not found', 404);
    let widthMm; let heightMm; let widthPx; let heightPx;
    if (payload.sourceType === 'custom') {
      widthMm = Number(payload.customWidthMm); heightMm = Number(payload.customHeightMm);
      widthPx = mmToPx(widthMm); heightPx = mmToPx(heightMm);
    } else {
      const scene = await SceneTemplate.findOne({ where: { scene_key: payload.sceneKey, is_active: true } });
      if (!scene) throw new AppError('Scene template not found', 404);
      widthMm = Number(scene.width_mm); heightMm = Number(scene.height_mm); widthPx = scene.pixel_width; heightPx = scene.pixel_height;
    }
    const task = await ImageTask.create({ image_id: image.id, user_id: userId, task_type: 'generate_id_photo', status: TASK_STATUS.PROCESSING, progress: 10, started_at: new Date() });
    try {
      const result = await generateIdPhoto({ originalPath: `${process.cwd()}${image.original_url}`, backgroundColor: payload.backgroundColor || 'white', widthPx, heightPx, beautyEnabled: !!payload.beautyEnabled });
      let printResult = { printUrl: null };
      if (payload.printLayoutType) printResult = await generatePrintLayout(result.hdPath, payload.printLayoutType);
      const imageResult = await ImageResult.create({ image_id: image.id, task_id: task.id, preview_url: result.previewUrl, hd_url: result.hdUrl, print_url: printResult.printUrl, background_color: payload.backgroundColor || 'white', width_mm: widthMm, height_mm: heightMm, pixel_width: widthPx, pixel_height: heightPx, quality_status: result.qualityStatus });
      await task.update({ status: TASK_STATUS.SUCCESS, progress: 100, finished_at: new Date() });
      return { task, imageResult };
    } catch (error) {
      await task.update({ status: TASK_STATUS.FAILED, error_message: error.message, progress: 100, finished_at: new Date() });
      throw error;
    }
  },
  history(userId, page = 1, pageSize = 10) {
    return Image.findAndCountAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], offset: (page - 1) * pageSize, limit: pageSize, include: [{ model: ImageResult }] });
  },
  detail(imageId, userId) { return Image.findOne({ where: { id: imageId, user_id: userId }, include: [{ model: ImageResult }, { model: ImageTask }] }); }
};
