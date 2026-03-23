const { createLogger, format, transports } = require('winston');
const appConfig = require('../config/app.config');

module.exports = createLogger({
  level: appConfig.logLevel || 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [new transports.Console()]
});
