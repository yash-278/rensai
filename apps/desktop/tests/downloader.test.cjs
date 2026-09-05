const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const ipc = require('../src/common/constants/ipcChannels.json');
const marker = '.rensai-incomplete';
function load(file, mocks) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, file), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  new Function('exports', 'require', compiled)(exports, (name) => mocks[name] ?? require(name));
  return exports;
}
const task = (id) => ({
  series: { id: 'series', title: 'Sample', extensionId: 'sample' },
  chapter: { id, chapterNumber: id },
  downloadsDir: '/original',
});
function harness(overrides = {}) {
  const files = new Map();
  const requests = [];
  const invoke = async (channel, ...args) => {
    requests.push({ channel, args });
    if (overrides[channel]) return overrides[channel](...args);
    if (channel === ipc.FILESYSTEM.GET_CHAPTER_DOWNLOAD_PATH) return `/sample/${args[1].id}`;
    if (channel === ipc.EXTENSION.GET_PAGE_REQUESTER_DATA) return {};
    if (channel === ipc.EXTENSION.GET_PAGE_URLS)
      return ['https://sample.invalid/1.jpg', 'https://sample.invalid/2.png?size=full'];
    if (channel === ipc.EXTENSION.GET_IMAGE) return Buffer.from('synthetic');
    throw Error('Unexpected channel');
  };
  const { DownloaderClient, downloadKey } = load('../src/renderer/services/downloader.ts', {
    fs: {
      mkdirSync() {},
      writeFileSync: (p, data) => {
        if (overrides.write) overrides.write(p);
        files.set(p, data);
      },
      unlinkSync: (p) => files.delete(p),
    },
    electron: { ipcRenderer: { invoke } },
    '@houdoku/ui/hooks/use-toast': { toast: () => ({ update() {} }) },
    '@/common/constants/ipcChannels.json': ipc,
    '@/common/constants/downloads': { DOWNLOAD_INCOMPLETE_FILE: marker },
  });
  return { client: new DownloaderClient(), downloadKey, files, requests };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
test('pause waits for the in-flight page; early resume cannot start a second worker, and later resume saves the remaining page', async () => {
  let finish;
  let requests = 0;
  const h = harness({
    [ipc.EXTENSION.GET_IMAGE]: () => {
      requests++;
      return requests === 1
        ? new Promise((r) => {
            finish = r;
          })
        : Buffer.from('page');
    },
  });
  h.client.add([task('1')]);
  const worker = h.client.start();
  await tick();
  h.client.pause();
  await h.client.start();
  assert.equal(requests, 1);
  assert.ok(h.client.currentTask);
  finish(Buffer.from('page'));
  await worker;
  assert.equal(h.client.queue[0].page, 1);
  assert.ok(h.files.has(`/sample/1/${marker}`));
  await h.client.start();
  assert.equal(requests, 2);
  assert.deepEqual([...h.files.keys()], ['/sample/1/1.jpg', '/sample/1/2.png']);
  assert.equal(h.client.queue.length, 0);
  assert.equal(h.client.currentTask, null);
});
test('pausing on the last page completes the chapter instead of requeuing it', async () => {
  let finish;
  const h = harness({
    [ipc.EXTENSION.GET_PAGE_URLS]: () => ['https://sample.invalid/1.jpg'],
    [ipc.EXTENSION.GET_IMAGE]: () =>
      new Promise((r) => {
        finish = r;
      }),
  });
  h.client.add([task('1')]);
  const worker = h.client.start();
  await tick();
  h.client.pause();
  finish(Buffer.from('page'));
  await worker;
  assert.equal(h.client.queue.length, 0);
  assert.ok(!h.files.has(`/sample/1/${marker}`));
});
for (const failure of ['prepare', 'image', 'save']) {
  test(`${failure} failure stops cleanly, keeps waiting entries, and retry uses the original directory`, async () => {
    let fail = true;
    const overrides =
      failure === 'prepare'
        ? {
            [ipc.EXTENSION.GET_PAGE_REQUESTER_DATA]: () => {
              if (fail) throw Error('synthetic');
              return {};
            },
          }
        : failure === 'image'
          ? {
              [ipc.EXTENSION.GET_IMAGE]: () => {
                if (fail) throw Error('synthetic');
                return Buffer.from('page');
              },
            }
          : {
              write: (p) => {
                if (fail && p.endsWith('.jpg')) throw Error('synthetic');
              },
            };
    const h = harness(overrides);
    h.client.add([task('1'), task('2')]);
    await h.client.start();
    assert.equal(h.client.running, false);
    assert.equal(h.client.currentTask, null);
    assert.equal(h.client.queue[0].chapter.id, '2');
    assert.equal(h.client.downloadErrors.length, 1);
    assert.ok(h.files.has(`/sample/1/${marker}`));
    h.client.retry([h.downloadKey(task('1'))], '/new-default');
    assert.equal(h.client.queue[1].downloadsDir, '/original');
    fail = false;
    await h.client.start();
    assert.equal(h.client.queue.length, 0);
    assert.equal(h.client.downloadErrors.length, 0);
  });
}
test('queue edits deduplicate incoming/current tasks and cannot remove or reorder the active task', () => {
  const h = harness();
  h.client.setCurrentTask(task('1'));
  h.client.add([task('1'), task('2'), task('2'), task('3')]);
  assert.deepEqual(
    h.client.queue.map((t) => t.chapter.id),
    ['2', '3'],
  );
  h.client.move(h.downloadKey(task('3')), -1);
  assert.deepEqual(
    h.client.queue.map((t) => t.chapter.id),
    ['3', '2'],
  );
  h.client.remove([h.downloadKey(task('1')), h.downloadKey(task('2'))]);
  assert.equal(h.client.currentTask.chapter.id, '1');
  assert.deepEqual(
    h.client.queue.map((t) => t.chapter.id),
    ['3'],
  );
});
test('both filesystem inventories exclude unfinished downloads and retain completed and legacy folders', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rensai-inventory-'));
  try {
    const api = load('../src/main/util/filesystem.ts', {
      '@/common/constants/downloads': { DOWNLOAD_INCOMPLETE_FILE: marker },
    });
    const chapters = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ].map((id) => ({ id, chapterNumber: '1' }));
    const series = task('1').series;
    const paths = chapters.map((chapter) => api.getChapterDownloadPath(series, chapter, dir));
    paths.forEach((p) => fs.mkdirSync(p, { recursive: true }));
    fs.writeFileSync(path.join(paths[0], marker), '');
    assert.deepEqual(api.getAllDownloadedChapterIds(dir), [chapters[1].id]);
    assert.deepEqual(await api.getChaptersDownloaded(series, chapters, dir), {
      [chapters[1].id]: true,
    });
    fs.unlinkSync(path.join(paths[0], marker));
    assert.equal(api.getAllDownloadedChapterIds(dir).length, 2);
    assert.equal(Object.keys(await api.getChaptersDownloaded(series, chapters, dir)).length, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
