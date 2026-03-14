const path = require('path');
const express = require('express');
const morgan = require('morgan');
const routes = require('./routes');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/static', express.static(path.resolve(process.cwd(), 'storage')));
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
