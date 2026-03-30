const path = require('path');
const { Image } = require('../models');
const { readMeta } = require('../utils/image-helper');
const { resolveUploadRelativePathFromAbsolute } = require('../utils/file-helper');
module.exports = {
  async createImageRecord(file, userId) {
    const filePath = file.path;
    const meta = await readMeta(filePath);
    const image = await Image.create({ user_id: userId, source_type: 'scene', original_url: resolveUploadRelativePathFromAbsolute(filePath), file_name: path.basename(filePath), mime_type: file.mimetype, file_size: file.size, width_px: meta.width, height_px: meta.height, status: 'uploaded' });
    return { image, meta };
  }
};
