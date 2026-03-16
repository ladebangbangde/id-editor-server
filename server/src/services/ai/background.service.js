const sharp = require('sharp');
const { BACKGROUND_COLORS } = require('../../constants/scenes');
module.exports = {
  async replaceBackground(inputPath, outputPath, color = 'white') {
    const hex = BACKGROUND_COLORS[color] || BACKGROUND_COLORS.white;
    const m = await sharp(inputPath).metadata();
    await sharp({ create: { width: m.width, height: m.height, channels: 3, background: hex } }).composite([{ input: inputPath }]).jpeg({ quality: 96 }).toFile(outputPath);
    return { outputPath, message: 'Background replaced (mock composite)' };
  }
};
