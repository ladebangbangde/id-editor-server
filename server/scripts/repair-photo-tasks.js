#!/usr/bin/env node
require('../src/load-env');

const { sequelize } = require('../src/models');
const photoRetentionService = require('../src/services/photoRetention.service');

async function main() {
  const limitArg = process.argv.find((item) => item.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 500;

  await sequelize.authenticate();
  const stats = await photoRetentionService.repairBrokenPhotoTasks({ limit });
  console.log(JSON.stringify({ success: true, stats }, null, 2));
  await sequelize.close();
}

main().catch(async (error) => {
  console.error(JSON.stringify({ success: false, message: error.message }, null, 2));
  try { await sequelize.close(); } catch (_error) {}
  process.exit(1);
});
