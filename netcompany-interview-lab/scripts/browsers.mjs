import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const args = process.argv[2] === 'install' ? ['install', 'chromium', 'firefox'] : ['test', ...process.argv.slice(3)];
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', ...args], {stdio: 'inherit', env: {...process.env, PLAYWRIGHT_BROWSERS_PATH: resolve('.cache/browsers')}});
process.exit(result.status ?? 1);
