const path = require('path');
const db = require('../db/knex');
const env = require('../config/env');
const { processIdPhoto } = require('../modules/imageProcessor');

async function createUploadedImage({ originalUrl, userId = null }) {
  const [id] = await db('images').insert({
    user_id: userId,
    original_url: originalUrl,
    status: 'uploaded'
  });
  return db('images').where({ id }).first();
}

async function getImageById(id) {
  return db('images').where({ id }).first();
}

async function generateImage({ imageId, bgColor, sizeType }) {
  const image = await getImageById(imageId);
  if (!image) {
    const err = new Error('图片不存在');
    err.status = 404;
    throw err;
  }

  const localOriginalPath = path.resolve(process.cwd(), image.original_url.replace('/static/', 'storage/'));
  const outputDir = path.resolve(process.cwd(), 'storage/processed');

  const result = await processIdPhoto({
    inputPath: localOriginalPath,
    outputDir,
    bgColor,
    sizeType
  });

  const previewUrl = `${env.appBaseUrl}/static/processed/${result.previewFileName}`;
  const hdUrl = `${env.appBaseUrl}/static/processed/${result.hdFileName}`;

  await db('images').where({ id: imageId }).update({
    preview_url: previewUrl,
    hd_url: hdUrl,
    bg_color: bgColor,
    size_type: sizeType,
    status: 'generated'
  });

  return { previewUrl, hdUrl, priceCents: 990 };
}

module.exports = {
  createUploadedImage,
  getImageById,
  generateImage
};
