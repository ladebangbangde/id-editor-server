const { Sequelize } = require('sequelize');
module.exports = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  timezone: '+08:00',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false
});
