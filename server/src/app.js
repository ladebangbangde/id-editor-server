require('./load-env');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const appConfig = require('./config/app.config');
const { ensureUploadDirs } = require('./utils/file-helper');
const auth = require('./middlewares/auth.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

ensureUploadDirs();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '2mb' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/uploads', express.static(appConfig.uploadDir));
app.use(appConfig.apiPrefix, auth);
app.use(`${appConfig.apiPrefix}/auth`, require('./routes/auth.routes'));
app.use(`${appConfig.apiPrefix}/home`, require('./routes/home.routes'));
app.use(`${appConfig.apiPrefix}/spec`, require('./routes/spec.routes'));
app.use(`${appConfig.apiPrefix}/scenes`, require('./routes/scene.routes'));
app.use(`${appConfig.apiPrefix}/upload`, require('./routes/upload.routes'));
app.use(`${appConfig.apiPrefix}/images`, require('./routes/image.routes'));
app.use(`${appConfig.apiPrefix}/tasks`, require('./routes/task.routes'));
app.use(`${appConfig.apiPrefix}/orders`, require('./routes/order.routes'));
app.use(`${appConfig.apiPrefix}/download`, require('./routes/download.routes'));
app.use(`${appConfig.apiPrefix}/admin`, require('./routes/admin.routes'));
app.use(`${appConfig.apiPrefix}/photo`, require('./routes/photo.routes'));
app.use(`${appConfig.apiPrefix}/formal-wear`, require('./routes/formal-wear.routes'));
app.use(errorHandler);

module.exports = app;
