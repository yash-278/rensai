const assert = require('node:assert/strict');
const { readFileSync, mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

// Compile the same loader the Electron main process uses, without booting a real user profile.
const filename = path.resolve(__dirname, '../src/main/services/local-source-provider.ts');
const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2021,
  },
});
const subject = new Module(filename, module);
subject.filename = filename;
subject.paths = module.paths;
subject._compile(compiled.outputText, filename);
const { loadLocalSourceProvider, snapshotSourceProvider } = subject.exports;

test('uses one snapshot from the Rensai provider', () => {
  let calls = 0;
  const ours = {
    getExtensions() {
      calls++;
      return { first: { client: {} }, second: { client: {} } };
    },
  };
  const sources = snapshotSourceProvider(ours);
  assert.equal(calls, 1);
  assert.equal(Object.keys(sources).length, 2);
});

test('loads and reloads only the selected local provider build', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'rensai-provider-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ name: '@rensai/sources', main: 'index.cjs' }),
  );
  const entry = path.join(directory, 'index.cjs');
  writeFileSync(entry, 'exports.RensaiClient = class { getVersion() { return "first"; } };');
  assert.equal(loadLocalSourceProvider(directory, null, require).getVersion(), 'first');
  const unrelated = require.cache[__filename];
  writeFileSync(entry, 'exports.RensaiClient = class { getVersion() { return "second"; } };');
  assert.equal(loadLocalSourceProvider(directory, null, require).getVersion(), 'second');
  assert.equal(require.cache[__filename], unrelated);
  assert.throws(() => loadLocalSourceProvider('relative/path', null, require), /absolute/);
  writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ name: '@tiyo/core', main: 'index.cjs' }),
  );
  assert.throws(() => loadLocalSourceProvider(directory, null, require), /@rensai\/sources/);
});

test(
  'loads the real Rensai build through the application loader',
  { skip: !process.env.RENSAI_SOURCES_PATH },
  () => {
    const provider = loadLocalSourceProvider(process.env.RENSAI_SOURCES_PATH, null, require);
    assert.equal(provider.getVersion(), '0.1.0-dev.0');
    const sources = snapshotSourceProvider(provider);
    assert.equal(Object.keys(sources).length, 34);
    assert.equal(sources['6b4e9df1-b369-4adc-8d36-fe954dd793e3'].metadata.name, 'MangaDex');
    assert.equal(sources['b21fcfa9-8b46-439f-b060-31832aaf1931'].metadata.name, 'Komga');
  },
);
