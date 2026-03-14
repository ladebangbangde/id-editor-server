const knex = require('knex');
const env = require('../config/env');

const db = knex({
  client: 'mysql2',
  connection: env.db,
  pool: { min: 0, max: 10 }
});

module.exports = db;
