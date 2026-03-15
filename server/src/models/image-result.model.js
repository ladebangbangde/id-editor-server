const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('ImageResult', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  image_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  task_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  preview_url: { type: DataTypes.STRING(255), allowNull: false },
  hd_url: { type: DataTypes.STRING(255), allowNull: false },
  print_url: DataTypes.STRING(255),
  background_color: { type: DataTypes.STRING(32), defaultValue: 'white' },
  width_mm: { type: DataTypes.DECIMAL(8,2), allowNull: false },
  height_mm: { type: DataTypes.DECIMAL(8,2), allowNull: false },
  pixel_width: { type: DataTypes.INTEGER, allowNull: false },
  pixel_height: { type: DataTypes.INTEGER, allowNull: false },
  quality_status: { type: DataTypes.STRING(32), defaultValue: 'pending' },
  is_paid_hd: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_paid_print: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'image_results', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
