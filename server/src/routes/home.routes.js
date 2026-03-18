const router = require('express').Router();
const homeController = require('../controllers/home.controller');

router.get('/config', homeController.config);
router.get('/templates', homeController.templates);

module.exports = router;
