const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('AdminUser', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(64), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.STRING(32), defaultValue: 'admin' },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  last_login_at: DataTypes.DATE
}, { tableName: 'admin_users', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
