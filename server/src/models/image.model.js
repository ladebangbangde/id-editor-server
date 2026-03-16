const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('Image', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  source_type: { type: DataTypes.ENUM('scene','custom'), allowNull: false, defaultValue: 'scene' },
  scene_key: DataTypes.STRING(64),
  custom_width_mm: DataTypes.DECIMAL(8,2),
  custom_height_mm: DataTypes.DECIMAL(8,2),
  original_url: { type: DataTypes.STRING(255), allowNull: false },
  file_name: { type: DataTypes.STRING(255), allowNull: false },
  mime_type: { type: DataTypes.STRING(64), allowNull: false },
  file_size: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  width_px: { type: DataTypes.INTEGER, allowNull: false },
  height_px: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING(32), defaultValue: 'uploaded' }
}, { tableName: 'images', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
