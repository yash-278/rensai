const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require(require.resolve('esbuild', { paths: [require.resolve('vite')] }));
const root = path.resolve(__dirname, '..');
const filename = path.join(__dirname, 'compiled-source-updates.cjs');
const output = buildSync({
  absWorkingDir: root,
  entryPoints: ['src/main/services/source-updates.ts'],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'cjs',
  write: false,
});
const subject = new Module(filename, module);
subject.filename = filename;
subject.paths = module.paths;
subject._compile(output.outputFiles[0].text, filename);
module.exports = subject.exports;
