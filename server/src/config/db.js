const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return String(value).toLowerCase() === 'true';
};

const parseJson = (rawValue, sourceName) => {
  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`Invalid JSON in ${sourceName}: ${error.message}`);
  }
};

const loadJsonFromFile = (filePath) => {
  if (!filePath) {
    return {};
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);

  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    return parseJson(fileContent, `DB_CONFIG_FILE(${resolvedPath})`);
  } catch (error) {
    throw new Error(`Unable to load DB config file "${resolvedPath}": ${error.message}`);
  }
};

const fileConfig = loadJsonFromFile(process.env.DB_CONFIG_FILE);
const envJsonConfig = parseJson(process.env.DB_CONFIG_JSON, 'DB_CONFIG_JSON');

const baseOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: process.env.DB_DIALECT || 'mysql',
  timezone: process.env.DB_TIMEZONE || '+08:00',
  logging: parseBoolean(process.env.DB_LOGGING) ? console.log : false
};

const mergedConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  uri: process.env.DB_URL,
  options: {
    ...baseOptions,
    ...(fileConfig.options || {}),
    ...(envJsonConfig.options || {})
  },
  ...fileConfig,
  ...envJsonConfig
};

if (typeof mergedConfig.options.logging === 'string') {
  mergedConfig.options.logging = parseBoolean(mergedConfig.options.logging) ? console.log : false;
}

if (!mergedConfig.uri) {
  const requiredKeys = ['database', 'username', 'password'];
  const missingKeys = requiredKeys.filter((key) => mergedConfig[key] === undefined || mergedConfig[key] === null);

  if (missingKeys.length > 0) {
    throw new Error(`Missing DB config keys: ${missingKeys.join(', ')}. Set DB_URL or complete DB_NAME/DB_USER/DB_PASSWORD.`);
  }
}

const sequelize = mergedConfig.uri
  ? new Sequelize(mergedConfig.uri, mergedConfig.options)
  : new Sequelize(
      mergedConfig.database,
      mergedConfig.username,
      mergedConfig.password,
      mergedConfig.options
    );

module.exports = sequelize;
