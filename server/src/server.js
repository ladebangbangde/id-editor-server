const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');

app.listen(env.port, () => {
  logger.info('Server started', { port: env.port, env: env.nodeEnv });
});
