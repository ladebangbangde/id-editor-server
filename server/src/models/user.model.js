const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('User', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  openid: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  unionid: DataTypes.STRING(64),
  nickname: { type: DataTypes.STRING(128), allowNull: false },
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  avatarUrl: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('avatar');
    },
    set(value) {
      this.setDataValue('avatar', value);
    }
  },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'users', underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
