const crypto = require('crypto');
const { UniqueConstraintError } = require('sequelize');
const AppError = require('../utils/app-error');

const JWT_SECRET_CONFIG_KEY = 'jwt_secret';
let cachedJwtSecret = null;
let systemConfigModel = null;

function getSystemConfigModel() {
  if (!systemConfigModel) {
    ({ SystemConfig: systemConfigModel } = require('../models'));
  }

  return systemConfigModel;
}

function generateJwtSecret() {
  return crypto.randomBytes(64).toString('base64url');
}

async function ensureSystemConfigTable() {
  await getSystemConfigModel().sync();
}

async function getConfig(configKey) {
  return getSystemConfigModel().findOne({
    where: {
      configKey,
      isActive: 1
    }
  });
}

async function setConfig(configKey, configValue) {
  const SystemConfig = getSystemConfigModel();
  const existing = await SystemConfig.findOne({ where: { configKey } });

  if (existing) {
    await existing.update({
      configValue,
      configVersion: (existing.configVersion || 1) + 1,
      isActive: 1
    });
    return existing;
  }

  return SystemConfig.create({
    configKey,
    configValue,
    configVersion: 1,
    isActive: 1
  });
}

async function initializeRuntimeConfigs() {
  await ensureSystemConfigTable();
  await getJwtSecret();
}

async function getJwtSecret() {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  const config = await getConfig(JWT_SECRET_CONFIG_KEY);

  if (config && config.configValue) {
    cachedJwtSecret = config.configValue;
    return cachedJwtSecret;
  }

  const generatedSecret = generateJwtSecret();

  try {
    const savedConfig = await setConfig(JWT_SECRET_CONFIG_KEY, generatedSecret);

    if (!savedConfig || !savedConfig.configValue) {
      throw new AppError('JWT_SECRET 初始化失败', 500, null, 9014);
    }

    cachedJwtSecret = savedConfig.configValue;
    return cachedJwtSecret;
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const existingConfig = await getConfig(JWT_SECRET_CONFIG_KEY);
      if (existingConfig && existingConfig.configValue) {
        cachedJwtSecret = existingConfig.configValue;
        return cachedJwtSecret;
      }
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('JWT_SECRET 初始化失败', 500, null, 9014);
  }
}

module.exports = {
  JWT_SECRET_CONFIG_KEY,
  initializeRuntimeConfigs,
  getConfig,
  setConfig,
  getJwtSecret
};
