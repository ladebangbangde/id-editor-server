const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('ImageTask', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  image_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  task_type: { type: DataTypes.STRING(64), allowNull: false },
  status: { type: DataTypes.ENUM('pending','processing','success','failed'), defaultValue: 'pending' },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  error_message: DataTypes.STRING(255),
  started_at: DataTypes.DATE,
  finished_at: DataTypes.DATE
}, { tableName: 'image_tasks', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
