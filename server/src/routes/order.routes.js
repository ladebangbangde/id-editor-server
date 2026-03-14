const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { success, fail } = require('../utils/apiResponse');
const { createOrder, getOrderById } = require('../services/order.service');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { imageId, amountCents, currency } = req.body;

    if (!imageId || !amountCents) {
      return fail(res, 'imageId 和 amountCents 必填', 4001, 400);
    }

    const order = await createOrder({
      imageId: Number(imageId),
      amountCents: Number(amountCents),
      currency: currency || 'CNY'
    });

    return success(res, {
      orderId: order.id,
      orderNo: order.order_no,
      paymentStatus: order.payment_status,
      // TODO: 接入微信支付后返回 prepay 信息
      prepayInfo: null
    });
  })
);

router.get(
  '/:orderId',
  asyncHandler(async (req, res) => {
    const order = await getOrderById(Number(req.params.orderId));
    if (!order) {
      return fail(res, '订单不存在', 4041, 404);
    }
    return success(res, order);
  })
);

module.exports = router;
