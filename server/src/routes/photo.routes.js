const router = require('express').Router();
const upload = require('../middlewares/upload.middleware');
const controller = require('../modules/photo/photo.controller');

router.get('/specs', controller.specs);
router.post('/process', upload.single('file'), controller.process);
router.post('/tasks', upload.single('file'), controller.createTask);
router.get('/history', controller.history);
router.get('/tasks/:taskId/status', controller.taskStatus);
router.get('/tasks/:taskId/result', controller.taskResult);
router.get('/tasks/:taskId', controller.taskDetail);
router.get('/tasks/:taskId/edit-draft', controller.editDraft);

module.exports = router;
