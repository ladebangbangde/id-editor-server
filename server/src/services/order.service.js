const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/app-error');
const { Order, ImageResult, PaymentRecord } = require('../models');
module.exports = {
  async createOrder({ userId, imageId, resultId, orderType }) {
    const amountMap = { hd: 9.9, print: 14.9, package: 19.9 };
    const order = await Order.create({ order_no: `ORD${dayjs().format('YYYYMMDDHHmmss')}${uuidv4().slice(0, 6)}`, user_id: userId, image_id: imageId, result_id: resultId, order_type: orderType, amount: amountMap[orderType] || 9.9, currency: 'CNY', status: 'pending' });
    return order;
  },
  detail(orderId, userId) { return Order.findOne({ where: { id: orderId, user_id: userId } }); },
  async mockPay(orderId, userId) {
    const order = await Order.findOne({ where: { id: orderId, user_id: userId } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status === 'paid') return order;
    await order.update({ status: 'paid', paid_at: new Date() });
    await PaymentRecord.create({ order_id: order.id, payment_channel: 'mock_wechat_pay', transaction_no: `MOCKTXN${Date.now()}`, amount: order.amount, status: 'success', raw_callback: { orderId: order.id, mocked: true } });
    const result = await ImageResult.findByPk(order.result_id);
    if (result) {
      if (['hd', 'package'].includes(order.order_type)) result.is_paid_hd = true;
      if (['print', 'package'].includes(order.order_type)) result.is_paid_print = true;
      await result.save();
    }
    return order;
  }
};
