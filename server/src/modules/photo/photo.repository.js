const { PhotoTask } = require('../../models');
const { Op } = require('sequelize');

// 兼容历史换装任务数据：沿用旧 size_code 过滤，避免混入当前证件照历史。
const LEGACY_FORMAL_WEAR_SIZE_CODE = '__formal_wear__';

module.exports = {
  create(payload) {
    return PhotoTask.create(payload);
  },

  async markProcessing(id, payload) {
    const record = await PhotoTask.findByPk(id);
    if (!record) return null;
    await record.update(payload);
    return record;
  },

  async markSuccess(id, payload) {
    const record = await PhotoTask.findByPk(id);
    if (!record) return null;
    await record.update(payload);
    return record;
  },

  async markFailed(id, payload) {
    const record = await PhotoTask.findByPk(id);
    if (!record) return null;
    await record.update(payload);
    return record;
  },

  findByTaskId(taskId, userId) {
    return PhotoTask.findOne({
      where: {
        task_id: taskId,
        user_id: userId,
        size_code: { [Op.ne]: LEGACY_FORMAL_WEAR_SIZE_CODE }
      }
    });
  },

  findHistoryByUserId(userId, { page, pageSize, status } = {}) {
    const where = {
      user_id: userId,
      size_code: { [Op.ne]: LEGACY_FORMAL_WEAR_SIZE_CODE }
    };

    if (status) {
      where.status = status;
    }

    return PhotoTask.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
  }
};
