const path = require('path');
const { Image } = require('../models');
const { readMeta } = require('../utils/image-helper');
const { relativeUploadPath, absoluteUploadPath } = require('../utils/file-helper');
const { FOLDERS } = require('../constants/file');
module.exports = {
  async createImageRecord(file, userId) {
    const filePath = absoluteUploadPath(FOLDERS.ORIGINAL, file.filename);
    const meta = await readMeta(filePath);
    const image = await Image.create({ user_id: userId, source_type: 'scene', original_url: relativeUploadPath(FOLDERS.ORIGINAL, file.filename), file_name: file.filename, mime_type: file.mimetype, file_size: file.size, width_px: meta.width, height_px: meta.height, status: 'uploaded' });
    return { image, meta };
  }
};
