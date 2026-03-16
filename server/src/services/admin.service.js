const { Op, fn, col, literal } = require('sequelize');
const { User, Image, ImageTask, Order } = require('../models');

module.exports = {
  async stats() {
    const [userCount, imageCount, successTaskCount, orderCount, paidOrderCount] = await Promise.all([
      User.count(),
      Image.count(),
      ImageTask.count({ where: { status: 'success' } }),
      Order.count(),
      Order.count({ where: { status: 'paid' } })
    ]);

    const hotScenes = await Image.findAll({
      attributes: ['scene_key', [fn('COUNT', col('id')), 'count']],
      where: { scene_key: { [Op.ne]: null } },
      group: ['scene_key'],
      order: [[literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });

    return { userCount, imageCount, successTaskCount, orderCount, paidOrderCount, hotScenes };
  }
};
