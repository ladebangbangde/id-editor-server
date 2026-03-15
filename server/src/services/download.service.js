const AppError = require('../utils/app-error');
const { ImageResult, Order, DownloadRecord } = require('../models');
module.exports = {
  async getPreview(resultId, userId, ip) {
    const result = await ImageResult.findByPk(resultId);
    if (!result) throw new AppError('Result not found', 404);
    await DownloadRecord.create({ user_id: userId, result_id: resultId, download_type: 'preview', download_ip: ip });
    return result.preview_url;
  },
  async getHd(resultId, userId, ip) {
    const result = await ImageResult.findByPk(resultId);
    if (!result || !result.is_paid_hd) throw new AppError('HD download requires paid order', 403);
    const paidOrder = await Order.findOne({ where: { result_id: resultId, user_id: userId, status: 'paid' } });
    if (!paidOrder) throw new AppError('No valid paid order', 403);
    await DownloadRecord.create({ user_id: userId, order_id: paidOrder.id, result_id: resultId, download_type: 'hd', download_ip: ip });
    return result.hd_url;
  },
  async getPrint(resultId, userId, ip) {
    const result = await ImageResult.findByPk(resultId);
    if (!result || !result.is_paid_print) throw new AppError('Print download requires paid order', 403);
    const paidOrder = await Order.findOne({ where: { result_id: resultId, user_id: userId, status: 'paid' } });
    if (!paidOrder) throw new AppError('No valid paid order', 403);
    await DownloadRecord.create({ user_id: userId, order_id: paidOrder.id, result_id: resultId, download_type: 'print', download_ip: ip });
    return result.print_url;
  }
};
