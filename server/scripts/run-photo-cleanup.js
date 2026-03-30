#!/usr/bin/env node
require('../src/load-env');

const { sequelize } = require('../src/models');
const { triggerCleanup } = require('../src/jobs/cleanup.job');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const batchArg = process.argv.find((item) => item.startsWith('--batch='));
  const batchSize = batchArg ? Number(batchArg.split('=')[1]) : undefined;

  await sequelize.authenticate();
  const stats = await triggerCleanup({ dryRun, batchSize });
  console.log(JSON.stringify({ success: true, stats }, null, 2));
  await sequelize.close();
}

main().catch(async (error) => {
  console.error(JSON.stringify({ success: false, message: error.message }, null, 2));
  try { await sequelize.close(); } catch (_error) {}
  process.exit(1);
});
