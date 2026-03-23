const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('SystemConfig', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  configKey: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true,
    field: 'config_key'
  },
  configValue: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    field: 'config_value'
  },
  configVersion: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    field: 'config_version'
  },
  isActive: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    field: 'is_active'
  }
}, {
  tableName: 'system_configs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
