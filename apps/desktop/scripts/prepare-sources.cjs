const { readFileSync, cpSync, rmSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { fetchSourceRelease, fetchSourceBundle, installSourceBundle } = require('./source-update-module.cjs');

async function main() {
  const local = process.env.RENSAI_SOURCES_BUNDLE;
  const release = local
    ? JSON.parse(readFileSync(path.join(local, 'manifest.json'), 'utf8'))
    : await fetchSourceRelease();
  const bytes = local ? readFileSync(path.join(local, 'rensai-sources.zip')) : await fetchSourceBundle(release);
  const root = path.resolve(__dirname, '../build');
  const directory = await installSourceBundle(path.join(root, 'source-install'), release, bytes, (directory) => {
    const { RensaiClient } = createRequire(__filename)(directory);
    const client = new RensaiClient(null);
    if (client.getVersion() !== release.version || !Object.keys(client.getExtensions()).length) {
      throw Error('The bundled provider could not be initialized.');
    }
  });
  const target = path.join(root, 'bundled-sources');
  rmSync(target, { recursive: true, force: true });
  cpSync(directory, target, { recursive: true });
  console.log(`Prepared Rensai Sources ${release.version} for desktop packaging.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
