const sharp = require('sharp');
const { DEFAULT_DPI } = require('../constants/scenes');
const mmToPx = (mm, dpi = DEFAULT_DPI) => Math.round((mm / 25.4) * dpi);
async function readMeta(filePath) { const m = await sharp(filePath).metadata(); return { width: m.width, height: m.height, format: m.format, size: m.size || 0 }; }
module.exports = { mmToPx, readMeta };
