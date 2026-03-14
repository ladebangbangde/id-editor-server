const express = require('express');
const uploadRoutes = require('./upload.routes');
const imageRoutes = require('./image.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'up' } });
});

router.use('/upload', uploadRoutes);
router.use('/images', imageRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
