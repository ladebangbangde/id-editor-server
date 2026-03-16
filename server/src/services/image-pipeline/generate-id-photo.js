const dayjs = require('dayjs');
const { FOLDERS } = require('../../constants/file');
const { buildFileName, absoluteUploadPath, relativeUploadPath } = require('../../utils/file-helper');
const detectionService = require('../ai/detection.service');
const segmentationService = require('../ai/segmentation.service');
const backgroundService = require('../ai/background.service');
const cropService = require('../ai/crop.service');
const enhancementService = require('../ai/enhancement.service');
const qualityCheckService = require('../ai/quality-check.service');
const buildPreview = require('./build-preview');

module.exports = async ({ originalPath, backgroundColor, widthPx, heightPx, beautyEnabled }) => {
  const bgFile = buildFileName('.jpg'); const cropFile = buildFileName('.jpg'); const hdFile = buildFileName('.jpg'); const previewFile = buildFileName('.jpg');
  const bgPath = absoluteUploadPath(FOLDERS.TEMP, bgFile);
  const cropPath = absoluteUploadPath(FOLDERS.TEMP, cropFile);
  const hdPath = absoluteUploadPath(FOLDERS.HD, hdFile);
  const previewPath = absoluteUploadPath(FOLDERS.PREVIEW, previewFile);
  await detectionService.detect(originalPath);
  await segmentationService.segment(originalPath);
  await backgroundService.replaceBackground(originalPath, bgPath, backgroundColor);
  await cropService.cropToSpec(bgPath, cropPath, widthPx, heightPx);
  if (beautyEnabled) await enhancementService.enhance(cropPath, hdPath); else await enhancementService.enhance(cropPath, hdPath);
  const quality = await qualityCheckService.check(hdPath);
  await buildPreview(hdPath, previewPath);
  return {
    hdPath,
    previewPath,
    hdUrl: relativeUploadPath(FOLDERS.HD, hdFile),
    previewUrl: relativeUploadPath(FOLDERS.PREVIEW, previewFile),
    qualityStatus: quality.passed ? 'passed' : 'failed',
    generatedAt: dayjs().toISOString()
  };
};
