const db = require('../db/knex');

function buildOrderNo() {
  return `IDP${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function createOrder({ imageId, amountCents, currency = 'CNY', userId = null }) {
  const orderNo = buildOrderNo();

  const [id] = await db('orders').insert({
    order_no: orderNo,
    user_id: userId,
    image_id: imageId,
    amount_cents: amountCents,
    currency,
    payment_status: 'unpaid',
    payment_channel: 'wxpay_mock',
    wx_prepay_id: null
  });

  return db('orders').where({ id }).first();
}

async function getOrderById(id) {
  return db('orders').where({ id }).first();
}

module.exports = {
  createOrder,
  getOrderById
};
