const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');

function loadRepositoryWithMock(photoTaskMock) {
  const modelsPath = require.resolve('../src/models');
  const repoPath = require.resolve('../src/modules/photo/photo.repository');

  delete require.cache[repoPath];
  delete require.cache[modelsPath];
  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: { PhotoTask: photoTaskMock }
  };

  return require(repoPath);
}

test('findHistoryByUserId should filter soft deleted records', async () => {
  let capturedWhere = null;
  const repository = loadRepositoryWithMock({
    findAndCountAll: async ({ where }) => {
      capturedWhere = where;
      return { count: 0, rows: [] };
    }
  });

  await repository.findHistoryByUserId(100, { page: 1, pageSize: 20 });
  assert.ok(capturedWhere);
  assert.deepEqual(capturedWhere.deleted_at, { [Op.is]: null });
});
