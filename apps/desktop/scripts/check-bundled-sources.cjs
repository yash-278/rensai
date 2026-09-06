const fs = require('node:fs');
const path = require('node:path');
module.exports = async () => {
  const filename = path.resolve(__dirname, '../build/bundled-sources/package.json');
  if (!fs.existsSync(filename)) throw Error('Run pnpm sources:prepare before packaging.');
  const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (manifest.name !== '@rensai/sources' || manifest.rensaiApiVersion !== 1) {
    throw Error('The bundled source package is incompatible.');
  }
};
