const path = require('path');
const Jimp = require('jimp');
const { v4: uuidv4 } = require('uuid');
const specs = require('../constants/idPhotoSpecs');

const BG_MAP = {
  blue: 0x4f6ef7ff,
  white: 0xffffffff,
  red: 0xe53e3eff
};

async function replaceBackground(image, bgColor) {
  const color = BG_MAP[bgColor] || BG_MAP.blue;
  const bg = await new Jimp(image.bitmap.width, image.bitmap.height, color);
  bg.composite(image, 0, 0);
  return bg;
}

async function cropToIdPhoto(image, sizeType) {
  const spec = specs[sizeType] || specs.one_inch;
  return image.cover(spec.width, spec.height);
}

async function generatePrintLayout(image) {
  const canvas = await new Jimp(1200, 1800, 0xffffffff);
  const margin = 40;
  const col = Math.floor((canvas.bitmap.width - margin) / (image.bitmap.width + margin));
  const row = Math.floor((canvas.bitmap.height - margin) / (image.bitmap.height + margin));

  let index = 0;
  for (let r = 0; r < row; r += 1) {
    for (let c = 0; c < col; c += 1) {
      const x = margin + c * (image.bitmap.width + margin);
      const y = margin + r * (image.bitmap.height + margin);
      canvas.composite(image, x, y);
      index += 1;
      if (index >= 8) return canvas;
    }
  }
  return canvas;
}

async function processIdPhoto({ inputPath, outputDir, bgColor, sizeType }) {
  const fileKey = uuidv4();
  const previewFileName = `${fileKey}-preview.jpg`;
  const hdFileName = `${fileKey}-hd.jpg`;

  const source = await Jimp.read(inputPath);
  source.quality(92);

  const replaced = await replaceBackground(source.clone(), bgColor);
  const idPhoto = await cropToIdPhoto(replaced, sizeType);
  const printLayout = await generatePrintLayout(idPhoto.clone());

  const previewPath = path.join(outputDir, previewFileName);
  const hdPath = path.join(outputDir, hdFileName);

  await idPhoto.clone().resize(413, Jimp.AUTO).quality(80).writeAsync(previewPath);
  await printLayout.quality(95).writeAsync(hdPath);

  return {
    previewFileName,
    hdFileName
  };
}

module.exports = {
  replaceBackground,
  cropToIdPhoto,
  generatePrintLayout,
  processIdPhoto
};
