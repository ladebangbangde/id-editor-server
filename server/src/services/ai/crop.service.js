const sharp = require('sharp');
module.exports = {
  async cropToSpec(inputPath, outputPath, width, height) {
    await sharp(inputPath).resize(width, height, { fit: 'cover', position: 'center' }).jpeg({ quality: 98 }).toFile(outputPath);
    return { outputPath, width, height };
  }
};
