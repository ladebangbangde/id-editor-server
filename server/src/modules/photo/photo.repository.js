const { PhotoTask } = require('../../models');
const { Op } = require('sequelize');

// 兼容历史换装任务数据：沿用旧 size_code 过滤，避免混入当前证件照历史。
const LEGACY_FORMAL_WEAR_SIZE_CODE = '__formal_wear__';

module.exports = {
  create(payload) {
    return PhotoTask.create(payload);
  },

  async updateById(id, payload) {
    const record = await PhotoTask.findByPk(id);
    if (!record) return null;
    await record.update(payload);
    return record;
  },

  markProcessing(id, payload) {
    return this.updateById(id, payload);
  },

  markSuccess(id, payload) {
    return this.updateById(id, payload);
  },

  markFailed(id, payload) {
    return this.updateById(id, payload);
  },

  findRawByTaskId(taskId) {
    return PhotoTask.findOne({ where: { task_id: taskId } });
  },

  findByTaskId(taskId, userId) {
    return PhotoTask.findOne({
      where: {
        task_id: taskId,
        user_id: userId,
        [Op.or]: [
          { size_code: { [Op.ne]: LEGACY_FORMAL_WEAR_SIZE_CODE } },
          { size_code: { [Op.is]: null } }
        ]
      }
    });
  },

  findHistoryByUserId(userId, { page, pageSize, statuses } = {}) {
    const where = {
      user_id: userId,
      [Op.or]: [
        { size_code: { [Op.ne]: LEGACY_FORMAL_WEAR_SIZE_CODE } },
        { size_code: { [Op.is]: null } }
      ]
    };

    if (Array.isArray(statuses) && statuses.length > 0) {
      where.status = statuses.length === 1 ? statuses[0] : { [Op.in]: statuses };
    }

    return PhotoTask.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });
  },

  LEGACY_FORMAL_WEAR_SIZE_CODE
};
