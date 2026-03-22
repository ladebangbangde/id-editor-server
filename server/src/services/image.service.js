const AppError = require('../utils/app-error');
const { mmToPx } = require('../utils/image-helper');
const { Image, ImageTask, ImageResult, SceneTemplate } = require('../models');
const { TASK_STATUS } = require('../constants/status');
const generateIdPhoto = require('./image-pipeline/generate-id-photo');
const generatePrintLayout = require('./image-pipeline/generate-print-layout');
const { normalizeAssetPath } = require('../utils/asset-url');

function serializeImageResult(result) {
  if (!result) return result;

  const serialized = typeof result.toJSON === 'function' ? result.toJSON() : { ...result };
  const previewUrl = normalizeAssetPath(serialized.preview_url);
  const hdUrl = normalizeAssetPath(serialized.hd_url);
  const printUrl = normalizeAssetPath(serialized.print_url);

  return {
    ...serialized,
    preview_url: previewUrl,
    hd_url: hdUrl,
    print_url: printUrl,
    previewUrl,
    hdUrl,
    resultUrl: hdUrl,
    printUrl
  };
}

function serializeImage(image) {
  if (!image) return image;

  const serialized = typeof image.toJSON === 'function' ? image.toJSON() : { ...image };
  const originalUrl = normalizeAssetPath(serialized.original_url);
  const imageResults = Array.isArray(serialized.ImageResults)
    ? serialized.ImageResults.map(serializeImageResult)
    : serialized.ImageResults;

  return {
    ...serialized,
    original_url: originalUrl,
    originalUrl,
    ImageResults: imageResults
  };
}

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
      const imageResult = await ImageResult.create({ image_id: image.id, task_id: task.id, preview_url: normalizeAssetPath(result.previewUrl), hd_url: normalizeAssetPath(result.hdUrl), print_url: normalizeAssetPath(printResult.printUrl), background_color: payload.backgroundColor || 'white', width_mm: widthMm, height_mm: heightMm, pixel_width: widthPx, pixel_height: heightPx, quality_status: result.qualityStatus });
      await task.update({ status: TASK_STATUS.SUCCESS, progress: 100, finished_at: new Date() });
      return { task, imageResult: serializeImageResult(imageResult) };
    } catch (error) {
      await task.update({ status: TASK_STATUS.FAILED, error_message: error.message, progress: 100, finished_at: new Date() });
      throw error;
    }
  },
  async history(userId, page = 1, pageSize = 10) {
    const result = await Image.findAndCountAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], offset: (page - 1) * pageSize, limit: pageSize, include: [{ model: ImageResult }] });
    return { ...result, rows: result.rows.map(serializeImage) };
  },
  async detail(imageId, userId) {
    const image = await Image.findOne({ where: { id: imageId, user_id: userId }, include: [{ model: ImageResult }, { model: ImageTask }] });
    return serializeImage(image);
  }
};
