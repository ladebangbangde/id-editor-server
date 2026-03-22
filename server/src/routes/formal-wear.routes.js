const router = require('express').Router();
const upload = require('../middlewares/upload.middleware');
const controller = require('../modules/formal-wear/formal-wear.controller');

router.post('/tasks', upload.any(), controller.createTask);
router.post('/process', upload.any(), controller.process);
router.get('/history', controller.history);
router.get('/tasks/:taskId', controller.taskDetail);

module.exports = router;
