const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('PhotoTask', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  task_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'), allowNull: false, defaultValue: 'PENDING' },
  source_url: { type: DataTypes.STRING(255), allowNull: false },
  preview_url: DataTypes.STRING(255),
  result_url: DataTypes.STRING(255),
  size_code: { type: DataTypes.STRING(64), allowNull: false },
  background_color: { type: DataTypes.STRING(32), allowNull: false },
  warnings: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  quality_status: { type: DataTypes.STRING(32), allowNull: false },
  quality_message: { type: DataTypes.STRING(255), allowNull: false },
  error_code: DataTypes.STRING(64),
  error_message: DataTypes.STRING(255),
  request_payload: { type: DataTypes.JSON, allowNull: false },
  response_payload: DataTypes.JSON
}, { tableName: 'photo_tasks', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
