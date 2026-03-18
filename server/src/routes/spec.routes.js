const router = require('express').Router();
const specController = require('../controllers/spec.controller');

router.get('/categories', specController.categories);
router.get('/list', specController.list);
router.get('/detail/:id', specController.detail);

module.exports = router;
