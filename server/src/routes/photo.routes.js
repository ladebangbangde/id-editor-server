const router = require('express').Router();
const upload = require('../middlewares/upload.middleware');
const controller = require('../modules/photo/photo.controller');

router.get('/specs', controller.specs);
router.post('/process', upload.single('file'), controller.process);
router.get('/tasks/:taskId', controller.taskDetail);

module.exports = router;
