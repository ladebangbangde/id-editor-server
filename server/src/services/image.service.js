const AppError = require('../utils/app-error');
const { mmToPx } = require('../utils/image-helper');
const { Image, ImageTask, ImageResult, SceneTemplate } = require('../models');
const { TASK_STATUS } = require('../constants/status');
const generateIdPhoto = require('./image-pipeline/generate-id-photo');
const generatePrintLayout = require('./image-pipeline/generate-print-layout');
const { normalizeAssetPath } = require('../utils/asset-url');
const { toAbsolutePublicUrl } = require('../utils/public-url');

function buildImageMeta(url, width, height, purpose) {
  if (!url) return null;
  return {
    format: String(url).split('?')[0].split('.').pop()?.toLowerCase() || null,
    width: width || null,
    height: height || null,
    purpose
  };
}

function serializeImageResult(result, req) {
  if (!result) return result;

  const serialized = typeof result.toJSON === 'function' ? result.toJSON() : { ...result };
  const previewUrl = toAbsolutePublicUrl(normalizeAssetPath(serialized.preview_url), req);
  const hdUrl = toAbsolutePublicUrl(normalizeAssetPath(serialized.hd_url), req);
  const printUrl = toAbsolutePublicUrl(normalizeAssetPath(serialized.print_url), req);
  const stablePreviewUrl = previewUrl || hdUrl || null;

  return {
    ...serialized,
    preview_url: stablePreviewUrl,
    hd_url: hdUrl,
    print_url: printUrl,
    previewUrl: stablePreviewUrl,
    thumbnailUrl: stablePreviewUrl,
    hdUrl,
    // 兼容历史客户端：resultUrl 继续返回高清图，后续统一使用 hdUrl
    resultUrl: hdUrl,
    printUrl,
    printLayoutUrl: printUrl,
    previewMeta: buildImageMeta(stablePreviewUrl, serialized.pixel_width, serialized.pixel_height, 'preview'),
    hdMeta: buildImageMeta(hdUrl, serialized.pixel_width, serialized.pixel_height, 'print')
  };
}

function serializeImage(image, req) {
  if (!image) return image;

  const serialized = typeof image.toJSON === 'function' ? image.toJSON() : { ...image };
  const originalUrl = toAbsolutePublicUrl(normalizeAssetPath(serialized.original_url), req);
  const imageResults = Array.isArray(serialized.ImageResults)
    ? serialized.ImageResults.map((item) => serializeImageResult(item, req))
    : serialized.ImageResults;

  return {
    ...serialized,
    original_url: originalUrl,
    originalUrl,
    ImageResults: imageResults
  };
}

module.exports = {
  async generate(userId, payload, req) {
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
      return { task, imageResult: serializeImageResult(imageResult, req) };
    } catch (error) {
      await task.update({ status: TASK_STATUS.FAILED, error_message: error.message, progress: 100, finished_at: new Date() });
      throw error;
    }
  },
  async history(userId, page = 1, pageSize = 10, req) {
    const result = await Image.findAndCountAll({ where: { user_id: userId }, order: [['created_at', 'DESC']], offset: (page - 1) * pageSize, limit: pageSize, include: [{ model: ImageResult }] });
    return { ...result, rows: result.rows.map((item) => serializeImage(item, req)) };
  },
  async detail(imageId, userId, req) {
    const image = await Image.findOne({ where: { id: imageId, user_id: userId }, include: [{ model: ImageResult }, { model: ImageTask }] });
    return serializeImage(image, req);
  }
};
