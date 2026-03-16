const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
module.exports = sequelize.define('PaymentRecord', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  payment_channel: { type: DataTypes.STRING(32), allowNull: false },
  transaction_no: { type: DataTypes.STRING(64), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  status: { type: DataTypes.STRING(32), allowNull: false },
  raw_callback: DataTypes.JSON
}, { tableName: 'payment_records', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
