const { existsSync, realpathSync } = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const directory =
  process.env.RENSAI_SOURCES_PATH ||
  path.resolve(__dirname, '../../../../rensai-sources/dist/libs/core');
if (!path.isAbsolute(directory) || !existsSync(path.join(directory, 'package.json'))) {
  console.error('Build the sibling rensai-sources repository first with pnpm build.');
  console.error('Alternatively set RENSAI_SOURCES_PATH to its absolute dist/libs/core directory.');
  process.exit(1);
}
const packageManager = process.env.npm_execpath;
if (!packageManager) {
  console.error('Run this command through pnpm: pnpm --filter @houdoku/desktop dev:sources');
  process.exit(1);
}
const child = spawn(process.execPath, [packageManager, 'exec', 'electron-vite', 'dev'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env, RENSAI_SOURCES_PATH: realpathSync(directory) },
});
child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
