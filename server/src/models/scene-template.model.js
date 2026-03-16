const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('SceneTemplate', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  scene_key: { type: DataTypes.STRING(64), unique: true, allowNull: false },
  scene_name: { type: DataTypes.STRING(64), allowNull: false },
  width_mm: { type: DataTypes.DECIMAL(8,2), allowNull: false },
  height_mm: { type: DataTypes.DECIMAL(8,2), allowNull: false },
  pixel_width: { type: DataTypes.INTEGER, allowNull: false },
  pixel_height: { type: DataTypes.INTEGER, allowNull: false },
  description: DataTypes.STRING(255),
  allow_beauty: { type: DataTypes.BOOLEAN, defaultValue: true },
  allow_print: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'scene_templates', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
