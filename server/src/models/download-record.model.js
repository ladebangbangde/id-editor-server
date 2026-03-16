const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('DownloadRecord', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  order_id: DataTypes.BIGINT.UNSIGNED,
  result_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  download_type: { type: DataTypes.ENUM('preview','hd','print'), allowNull: false },
  download_ip: DataTypes.STRING(64),
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'download_records', underscored: true, timestamps: false });
