// Exercise the built application through Chromium's test protocol in a disposable profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { createHash } = require('node:crypto');
const JSZip = require('jszip');
const { installSourceBundle } = require('./source-update-module.cjs');

async function main() {
  const executable = process.argv[2];
  if (!executable || !path.isAbsolute(executable)) throw Error('Pass the absolute packaged executable path.');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rensai-packaged-smoke-'));
  const content = path.join(root, 'Fixture Book', 'c1');
  fs.mkdirSync(content, { recursive: true });
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(path.join(content, '01.png'), pixel);
  fs.writeFileSync(path.join(content, '02.png'), pixel);
  const child = spawn(executable, ['--remote-debugging-port=0'], {
    cwd: root,
    env: { ...process.env, RENSAI_USER_DATA_DIR: path.join(root, 'profile'), START_MINIMIZED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', b => { logs += b; });
  child.stderr.on('data', b => { logs += b; });
  let socket;
  const wait = async (check, label) => {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (await check()) return;
      if (child.exitCode !== null) throw Error(`Packaged app exited during ${label}.`);
      await delay(100);
    }
    throw Error(`Timed out waiting for ${label}.`);
  };
  try {
    await wait(() => /DevTools listening on ws:\/\/127.0.0.1:(\d+)/.test(logs), 'debugger');
    const port = logs.match(/DevTools listening on ws:\/\/127.0.0.1:(\d+)/)[1];
    let target;
    await wait(async () => {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = targets.find(t => t.type === 'page' && t.url.startsWith('file:'));
      return target;
    }, 'renderer');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let sequence = 0;
    const pending = new Map();
    socket.onmessage = event => {
      const response = JSON.parse(event.data);
      const task = pending.get(response.id);
      if (task) {
        pending.delete(response.id);
        if (response.error) task.reject(Error(response.error.message));
        else task.resolve(response.result);
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const run = async expression => {
      const result = await send('Runtime.evaluate', { expression: `window.__smokePromise = (0, eval)(${JSON.stringify(expression)})`, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const click = text => run(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!button) throw Error('Button missing: ' + ${JSON.stringify(text)}); button.click(); })()`);
    await wait(() => run("document.body?.innerText.includes('Library')"), 'application UI');
    const status = await run("require('electron').ipcRenderer.invoke('extension-manager-get-local-provider-status')");
    assert.equal(status.sourceCount, 34);
    assert.equal(status.error, undefined);
    assert.equal(await run("require('electron').ipcRenderer.invoke('extension-manager-get-all').then(s => s.length)"), 35);
    await run("location.hash = '#/plugins'");
    await wait(() => run("document.body.innerText.includes('34 sources loaded')"), 'source catalog');
    assert.equal(await run("[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Update sources')"), true);
    await click('Reload sources');
    await wait(() => run("document.body.innerText.includes('34 sources loaded')"), 'source reload');

    // A new provider version is installed independently, while this desktop binary stays open.
    const zip = new JSZip();
    const bundled = path.resolve(path.dirname(executable), '../Resources/rensai-sources');
    const add = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) add(filename);
        else zip.file(path.relative(bundled, filename).split(path.sep).join('/'), fs.readFileSync(filename));
      }
    };
    add(bundled);
    const manifest = JSON.parse(await zip.file('package.json').async('string'));
    const nextVersion = manifest.version.split('.').map(Number);
    nextVersion[2]++;
    manifest.version = nextVersion.join('.');
    zip.file('package.json', JSON.stringify(manifest));
    const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await run(`localStorage.setItem('extension-settings-b21fcfa9-8b46-439f-b060-31832aaf1931', JSON.stringify({ 'Address (with port)': 'http://127.0.0.1:9999' }))`);
    await installSourceBundle(path.join(root, 'profile/rensai-sources'), {
      version: manifest.version, apiVersion: 1, size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }, bytes, directory => assert.equal(new (require(directory).RensaiClient)(null).getVersion(), manifest.version));
    await click('Reload sources');
    await wait(() => run(`document.body.innerText.includes(${JSON.stringify(manifest.version)}) && document.body.innerText.includes('34 sources loaded')`), 'independent source update');
    assert.equal(await run("require('electron').ipcRenderer.invoke('extension-getSettings', 'b21fcfa9-8b46-439f-b060-31832aaf1931').then(s => s['Address (with port)'])"), 'http://127.0.0.1:9999');

    // Import synthetic files through the real provider IPC, then open the real reader.
    await run(`(async () => {
      const ipc = require('electron').ipcRenderer;
      const id = '9ef3242e-b5a0-4f56-bf2f-5e0c9f6f50ab';
      const series = await ipc.invoke('extension-getSeries', id, ${JSON.stringify(path.dirname(content))});
      const chapters = await ipc.invoke('extension-getChapters', id, series.sourceId);
      series.id = 'fixture-series';
      chapters[0].id = 'fixture-chapter';
      localStorage.setItem('library-series-list', JSON.stringify([series]));
      localStorage.setItem('library-chapters-fixture-series', JSON.stringify(chapters));
      location.hash = '#/reader/fixture-series/fixture-chapter';
    })()`);
    await wait(() => run("[...document.images].some(i => i.complete && i.naturalWidth > 0 && !i.src.includes('icon'))"), 'reader image');
    const persisted = await run("JSON.parse(localStorage.getItem('library-series-list')).length");
    assert.equal(persisted, 1);
    await run("location.hash = '#/'");
    await wait(() => run("document.body.innerText.includes('Settings')"), 'dashboard');
    await click('Settings');
    await wait(() => run("[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Create backup')"), 'backup controls');
    // Capture the real export Blob without opening a native save dialog.
    await run(`window.__backup = null; window.__originalCreateURL = URL.createObjectURL;
      URL.createObjectURL = blob => { blob.text().then(text => window.__backup = text); return 'blob:smoke'; };
      window.__originalAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {};`);
    await click('Create backup');
    await wait(() => run('window.__backup !== null'), 'backup export');
    const backup = await run('window.__backup');
    const backupPath = path.join(root, 'backup.json');
    fs.writeFileSync(backupPath, backup);
    assert.equal(JSON.parse(JSON.parse(backup)['library-series-list']).length, 1);
    await run(`URL.createObjectURL = window.__originalCreateURL; HTMLAnchorElement.prototype.click = window.__originalAnchorClick;
      localStorage.setItem('library-series-list', '[]');
      const ipc = require('electron').ipcRenderer; window.__invoke = ipc.invoke.bind(ipc);
      ipc.invoke = (channel, ...args) => channel === 'show-open-dialog' ? Promise.resolve([${JSON.stringify(backupPath)}]) : window.__invoke(channel, ...args);`);
    await click('Restore…');
    await wait(() => run("document.body.innerText.includes('Choose backup and restore')"), 'restore confirmation');
    await click('Choose backup and restore');
    await wait(() => run("document.body.innerText.includes('Library backup restored.')"), 'backup restore');
    assert.equal(await run("JSON.parse(localStorage.getItem('library-series-list')).length"), 1);
    assert.ok(logs.includes('Loaded Rensai Sources'));
    console.log('PASS: packaged app, bundled sources, independent source update, saved settings, renderer IPC, local reading, backup export and restore in an isolated profile.');
  } catch (error) {
    // Only this disposable profile and synthetic content were used.
    console.error(logs.slice(-4000));
    throw error;
  } finally {
    socket?.close();
    child.kill('SIGTERM');
    await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
    if (child.exitCode === null) child.kill('SIGKILL');
    fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
