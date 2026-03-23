require('dotenv').config();
const app = require('./app');
const appConfig = require('./config/app.config');
const { sequelize } = require('./models');
const runtimeConfigService = require('./services/runtime-config.service');

const start = async () => {
  await sequelize.authenticate();
  await runtimeConfigService.initializeRuntimeConfigs();
  app.listen(appConfig.port, () => console.log(`Server running at ${appConfig.port}`));
};

start();
