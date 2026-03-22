const router = require('express').Router();
const upload = require('../middlewares/upload.middleware');
const controller = require('../modules/formal-wear/formal-wear.controller');

router.post('/process', upload.single('file'), controller.process);
router.get('/history', controller.history);
router.get('/tasks/:taskId', controller.taskDetail);

module.exports = router;
