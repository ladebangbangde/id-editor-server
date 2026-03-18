const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define(
  'SpecTemplate',
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    category_key: { type: DataTypes.STRING(64), allowNull: false },
    scene_key: { type: DataTypes.STRING(64), allowNull: false },
    name: { type: DataTypes.STRING(64), allowNull: false },
    scene: { type: DataTypes.STRING(128), allowNull: false },
    tip: { type: DataTypes.STRING(255), allowNull: true },
    pixel_width: { type: DataTypes.INTEGER, allowNull: false },
    pixel_height: { type: DataTypes.INTEGER, allowNull: false },
    pixel_text: { type: DataTypes.STRING(32), allowNull: false },
    width_mm: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    height_mm: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    background_options: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    is_hot: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    action_path: { type: DataTypes.STRING(255), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  },
  {
    tableName: 'spec_templates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
