const router = require('express').Router();
const { fail } = require('../utils/api-response');

const OFFLINE_MESSAGE = '该功能已下线';
const OFFLINE_CODE = 4101;

function respondOffline(_req, res) {
  return fail(res, OFFLINE_MESSAGE, null, 410, OFFLINE_CODE);
}

router.post('/tasks', respondOffline);
router.post('/process', respondOffline);
router.get('/history', respondOffline);
router.get('/tasks/:taskId', respondOffline);
router.get('/tasks/:taskId/edit-draft', respondOffline);

module.exports = router;
