const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('Order', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_no: { type: DataTypes.STRING(64), unique: true, allowNull: false },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  image_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  result_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  order_type: { type: DataTypes.ENUM('hd','print','package'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  currency: { type: DataTypes.STRING(8), defaultValue: 'CNY' },
  status: { type: DataTypes.ENUM('pending','paid','cancelled','refunded'), defaultValue: 'pending' },
  paid_at: DataTypes.DATE
}, { tableName: 'orders', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
