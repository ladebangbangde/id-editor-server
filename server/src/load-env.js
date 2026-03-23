const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const candidatePaths = [
  process.env.DOTENV_CONFIG_PATH,
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.runtime'),
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '.env.runtime'),
  path.resolve(__dirname, '..', '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env.runtime')
].filter(Boolean);

for (const envPath of candidatePaths) {
  if (!fs.existsSync(envPath)) continue;
  dotenv.config({ path: envPath, override: false });
  break;
}
