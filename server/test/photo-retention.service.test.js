const test = require('node:test');
const assert = require('node:assert/strict');

function loadServiceWithMock(photoTaskMock) {
  const modelsPath = require.resolve('../src/models');
  const configPath = require.resolve('../src/config/app.config');
  const servicePath = require.resolve('../src/services/photoRetention.service');

  delete require.cache[servicePath];
  delete require.cache[modelsPath];

  const appConfig = require(configPath);
  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: { PhotoTask: photoTaskMock }
  };

  const service = require(servicePath);
  return { service, appConfig };
}

test('collectFileCandidates should tolerate null source_url and gather multi-field paths', () => {
  const photoTaskMock = {};
  const { service } = loadServiceWithMock(photoTaskMock);

  const candidates = service.collectFileCandidates({
    source_url: null,
    original_path: '/uploads/user/a/original.jpg',
    preview_url: 'http://localhost:3000/uploads/user/a/preview.jpg',
    result_url: '/uploads/user/a/hd.jpg',
    print_path: '/uploads/user/a/print.jpg'
  });

  assert.equal(candidates.length, 4);
});

test('purgeExpiredPhotos should not crash on dirty record and should continue', async () => {
  let call = 0;
  const updates = [];
  const photoTaskMock = {
    findAll: async () => {
      call += 1;
      if (call === 1) {
        return [
          {
            id: 1,
            task_id: 'dirty-task',
            source_url: null,
            original_path: null,
            preview_url: null,
            preview_path: null,
            result_url: null,
            hd_path: null,
            print_url: null,
            print_path: null,
            deleted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            status: 'SUCCESS',
            created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            task_id: 'ok-task',
            source_url: '/uploads/user/b/source.jpg',
            deleted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            status: 'SUCCESS',
            created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
          }
        ];
      }
      return [];
    },
    update: async (payload, where) => {
      updates.push({ payload, where });
      return [1];
    }
  };

  const { service } = loadServiceWithMock(photoTaskMock);
  const stats = await service.purgeExpiredPhotos({ batchSize: 10 });

  assert.equal(stats.scanned, 2);
  assert.equal(stats.candidateCount, 2);
  assert.ok(updates.length >= 2);
});

test('purgeExpiredPhotos should respect TTL for non-deleted records', async () => {
  let call = 0;
  const updates = [];
  const now = new Date();
  const photoTaskMock = {
    findAll: async () => {
      call += 1;
      if (call === 1) {
        return [{
          id: 3,
          task_id: 'fresh-task',
          source_url: '/uploads/user/c/source.jpg',
          deleted_at: null,
          status: 'SUCCESS',
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        }];
      }
      return [];
    },
    update: async (payload) => {
      updates.push(payload);
      return [1];
    }
  };

  const { service, appConfig } = loadServiceWithMock(photoTaskMock);
  appConfig.fileTtlHours = 24 * 30;
  const stats = await service.purgeExpiredPhotos({ now, batchSize: 10 });

  assert.equal(stats.candidateCount, 0);
  assert.equal(updates.length, 0);
});
