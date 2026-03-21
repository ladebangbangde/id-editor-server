const { PhotoTask } = require('../../models');

module.exports = {
  create(payload) {
    return PhotoTask.create(payload);
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
        user_id: userId
      }
    });
  }
};
