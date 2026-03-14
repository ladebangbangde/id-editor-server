const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { success, fail } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { createUploadedImage } = require('../services/image.service');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.resolve(process.cwd(), 'storage/uploads'));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '.jpg') || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return fail(res, '未检测到上传文件', 4001, 400);
    }

    const originalUrl = `/static/uploads/${req.file.filename}`;
    const image = await createUploadedImage({ originalUrl });

    return success(res, {
      imageId: image.id,
      originalUrl
    });
  })
);

module.exports = router;
