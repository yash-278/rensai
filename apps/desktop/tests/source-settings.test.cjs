const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const ipc = require('../src/common/constants/ipcChannels.json');
const keys = require('../src/common/constants/storeKeys.json');
function harness(invoke, entries = {}) {
  const saved = new Map(Object.entries(entries));
  const exports = {};
  const compiled = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../src/renderer/services/sourceSettings.ts'), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const storage = {
    read: (key) => saved.get(key) ?? null,
    write: (key, value) => saved.set(key, value),
  };
  const mocks = {
    electron: { ipcRenderer: { invoke } },
    '@/common/constants/ipcChannels.json': ipc,
    '@/common/constants/storeKeys.json': keys,
    '@/renderer/util/persistantStore': storage,
    '@/common/temp_fs_metadata': { FS_METADATA: { id: 'filesystem' } },
  };
  new Function('exports', 'require', compiled)(exports, (name) => {
    if (!(name in mocks)) throw Error(name);
    return mocks[name];
  });
  return { ...exports, saved, storage };
}
const key = (id) => keys.EXTENSION_SETTINGS_PREFIX + id;
test('restoration is shared and waits for every source write, excluding filesystem', async () => {
  const pending = [];
  const writes = [];
  const h = harness(
    async (channel, id) => {
      if (channel === ipc.EXTENSION_MANAGER.GET_ALL)
        return [{ id: 'one' }, { id: 'two' }, { id: 'filesystem' }];
      writes.push(id);
      await new Promise((resolve) => pending.push(resolve));
    },
    { [key('one')]: '{}', [key('two')]: '{}', [key('filesystem')]: '{}' },
  );
  let done = false;
  const first = h.restoreSourceSettings();
  const second = h.restoreSourceSettings();
  assert.equal(first, second);
  first.then(() => {
    done = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(writes, ['one', 'two']);
  pending[0]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(done, false);
  pending[1]();
  assert.deepEqual(await first, []);
});
test('corrupt or rejected stored settings identify failed sources without hiding healthy ones', async () => {
  const h = harness(
    async (channel, id) => {
      if (channel === ipc.EXTENSION_MANAGER.GET_ALL)
        return ['broken', 'denied', 'healthy'].map((id) => ({ id }));
      if (id === 'denied') throw Error('Synthetic');
    },
    { [key('broken')]: '{', [key('denied')]: '{}', [key('healthy')]: '{}' },
  );
  assert.deepEqual(await h.restoreSourceSettings(), ['broken', 'denied']);
});
test('save changes only the chosen source and persists provider-normalized values', async () => {
  const calls = [];
  const h = harness(
    async (channel, id, value) => {
      calls.push({ channel, id, value });
      if (channel === ipc.EXTENSION.GET_SETTINGS) return { 'API Key': 'sample-key' };
    },
    { [key('other')]: '{"keep":true}' },
  );
  assert.deepEqual(await h.saveSourceSettings('selected', { 'API Key': ' sample-key ' }), {
    'API Key': 'sample-key',
  });
  assert.ok(calls.every((c) => c.id === 'selected'));
  assert.equal(h.saved.get(key('selected')), '{"API Key":"sample-key"}');
  assert.equal(h.saved.get(key('other')), '{"keep":true}');
});
test('provider rejection never persists edits; storage failure reports the session-only state', async () => {
  let reject = true;
  const h = harness(
    async (channel) => {
      if (reject) throw Error('Synthetic');
      if (channel === ipc.EXTENSION.GET_SETTINGS) return { value: 'new' };
    },
    { [key('selected')]: '{"value":"old"}' },
  );
  await assert.rejects(h.saveSourceSettings('selected', { value: 'new' }));
  assert.equal(h.saved.get(key('selected')), '{"value":"old"}');
  reject = false;
  h.storage.write = () => {
    throw Error('Synthetic disk failure');
  };
  await assert.rejects(
    h.saveSourceSettings('selected', { value: 'new' }),
    /applied for this session/,
  );
});
