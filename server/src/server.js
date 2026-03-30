require('./load-env');
const app = require('./app');
const appConfig = require('./config/app.config');
const { sequelize } = require('./models');
const runtimeConfigService = require('./services/runtime-config.service');
const { startCleanupJob } = require('./jobs/cleanup.job');

const start = async () => {
  await sequelize.authenticate();
  await runtimeConfigService.initializeRuntimeConfigs();
  app.listen(appConfig.port, () => console.log(`Server running at ${appConfig.port}`));
  startCleanupJob();
};

start();
