const { PhotoTask } = require('../../models');
const { Op } = require('sequelize');

// 兼容历史换装任务数据：沿用旧 size_code 过滤，避免混入当前证件照历史。
const LEGACY_FORMAL_WEAR_SIZE_CODE = '__formal_wear__';

function getCommonScope(userId) {
  return {
    user_id: userId,
    [Op.or]: [
      { size_code: { [Op.ne]: LEGACY_FORMAL_WEAR_SIZE_CODE } },
      { size_code: { [Op.is]: null } }
    ]
  };
}

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
        ...getCommonScope(userId),
        task_id: taskId,
        deleted_at: { [Op.is]: null }
      }
    });
  },

  findByTaskIdIncludingDeleted(taskId, userId) {
    return PhotoTask.findOne({
      where: {
        ...getCommonScope(userId),
        task_id: taskId
      }
    });
  },

  findHistoryByUserId(userId, { page, pageSize, statuses } = {}) {
    const where = {
      ...getCommonScope(userId),
      deleted_at: { [Op.is]: null }
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

  async softDeleteByTaskId(taskId, userId, payload = {}) {
    const record = await this.findByTaskIdIncludingDeleted(taskId, userId);
    if (!record) return null;
    if (record.deleted_at) return record;
    await record.update(payload);
    return record;
  },

  findCleanupCandidates(now, limit = 100) {
    return PhotoTask.findAll({
      where: {
        [Op.or]: [
          {
            deleted_at: { [Op.not]: null },
            physical_delete_after: { [Op.lte]: now },
            [Op.or]: [
              { source_url: { [Op.not]: null }, source_deleted_at: { [Op.is]: null } },
              { preview_url: { [Op.not]: null }, preview_deleted_at: { [Op.is]: null } },
              { result_url: { [Op.not]: null }, result_deleted_at: { [Op.is]: null } }
            ]
          },
          {
            deleted_at: { [Op.is]: null },
            [Op.or]: [
              { source_url: { [Op.not]: null }, source_deleted_at: { [Op.is]: null } },
              { preview_url: { [Op.not]: null }, preview_deleted_at: { [Op.is]: null } },
              { result_url: { [Op.not]: null }, result_deleted_at: { [Op.is]: null } }
            ]
          }
        ]
      },
      order: [['created_at', 'ASC']],
      limit
    });
  },

  async updateById(id, payload = {}) {
    const record = await PhotoTask.findByPk(id);
    if (!record) return null;
    await record.update(payload);
    return record;
  },

  LEGACY_FORMAL_WEAR_SIZE_CODE
};
