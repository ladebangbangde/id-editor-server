const test = require('node:test');
const assert = require('node:assert/strict');

function bootWithPhotoTaskMock(photoTaskMock) {
  const modelsPath = require.resolve('../src/models');
  const servicePath = require.resolve('../src/services/photoRetention.service');
  const repoPath = require.resolve('../src/modules/photo/photo.repository');

  delete require.cache[servicePath];
  delete require.cache[repoPath];
  delete require.cache[modelsPath];

  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: { PhotoTask: photoTaskMock }
  };

  return {
    service: require(servicePath),
    repository: require(repoPath)
  };
}

test('integration flow: delete history then purge expired without blocking healthy rows', async () => {
  const now = new Date('2026-03-30T00:00:00.000Z');
  const rows = [
    {
      id: 1,
      task_id: 't1',
      user_id: 7,
      deleted_at: null,
      file_expire_at: null,
      source_url: '/uploads/user/7/a.jpg',
      status: 'SUCCESS',
      created_at: new Date('2026-03-01T00:00:00.000Z')
    },
    {
      id: 2,
      task_id: 't2',
      user_id: 7,
      deleted_at: new Date('2026-03-10T00:00:00.000Z'),
      source_url: null,
      status: 'SUCCESS',
      created_at: new Date('2026-03-01T00:00:00.000Z')
    }
  ];

  const mock = {
    async findOne({ where }) {
      return rows.find((r) => r.task_id === where.task_id && r.user_id === where.user_id) || null;
    },
    async findByPk(id) {
      return rows.find((r) => r.id === id) || null;
    },
    async update(payload, { where }) {
      const target = rows.find((r) => r.id === where.id);
      Object.assign(target, payload);
      return [1];
    },
    async findAll() {
      return rows.filter((r) => !r.purged_at);
    },
    async findAndCountAll({ where }) {
      const data = rows.filter((r) => r.user_id === where.user_id && r.deleted_at === null);
      return { count: data.length, rows: data };
    }
  };

  const { service, repository } = bootWithPhotoTaskMock(mock);

  const deleteResult = await service.markHistoryDeleted('t1', 7, now);
  assert.equal(deleteResult.deleted, true);

  const history = await repository.findHistoryByUserId(7, { page: 1, pageSize: 20 });
  assert.equal(history.rows.length, 0);

  const purgeStats = await service.purgeExpiredPhotos({ now, batchSize: 100 });
  assert.ok(purgeStats.candidateCount >= 1);
});
