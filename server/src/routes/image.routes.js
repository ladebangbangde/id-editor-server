const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { success, fail } = require('../utils/apiResponse');
const { generateImage, getImageById } = require('../services/image.service');

const router = express.Router();

router.post(
  '/:imageId/generate',
  asyncHandler(async (req, res) => {
    const imageId = Number(req.params.imageId);
    const { bgColor, sizeType } = req.body;

    if (!imageId || !bgColor || !sizeType) {
      return fail(res, 'imageId、bgColor、sizeType 不能为空', 4001, 400);
    }

    const data = await generateImage({ imageId, bgColor, sizeType });
    return success(res, data);
  })
);

router.get(
  '/:imageId',
  asyncHandler(async (req, res) => {
    const image = await getImageById(Number(req.params.imageId));
    if (!image) {
      return fail(res, '图片不存在', 4041, 404);
    }
    return success(res, image);
  })
);

module.exports = router;
