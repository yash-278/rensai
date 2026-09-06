// Run with Electron, not Node. This never opens the normal application profile or a website.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require(require.resolve('esbuild', { paths: [require.resolve('vite')] }));

const profile = mkdtempSync(path.join(tmpdir(), 'rensai-electron-smoke-'));
app.setPath('userData', profile);
process.env.RENSAI_SOURCES_PATH ||= path.resolve(
  __dirname,
  '../../../../rensai-sources/dist/libs/core',
);
const channels = require('../src/common/constants/ipcChannels.json');
const deadline = setTimeout(() => {
  console.error('Source smoke test timed out.');
  app.exit(1);
}, 20000);

app
  .whenReady()
  .then(async () => {
    const window = new BrowserWindow({ show: false });
    const cwd = path.resolve(__dirname, '..');
    const output = buildSync({
      absWorkingDir: cwd,
      entryPoints: ['src/main/services/extension.ts'],
      tsconfig: 'tsconfig.json',
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'cjs',
      write: false,
      logLevel: 'silent',
    });
    const filename = path.join(__dirname, 'compiled-source-smoke.cjs');
    const subject = new Module(filename, module);
    subject.filename = filename;
    subject.paths = module.paths;
    subject._compile(output.outputFiles[0].text, filename);
    const handlers = new Map();
    subject.exports.createExtensionIpcHandlers(
      { handle: (channel, handler) => handlers.set(channel, handler) },
      window,
    );
    const invoke = (channel, ...args) => handlers.get(channel)({}, ...args);
    await subject.exports.loadPlugins(window);
    assert.deepEqual(invoke(channels.EXTENSION_MANAGER.GET_LOCAL_PROVIDER_STATUS), {
      version: require(path.join(process.env.RENSAI_SOURCES_PATH, 'package.json')).version,
      sourceCount: 34,
    });
    assert.equal(invoke(channels.EXTENSION_MANAGER.GET_ALL).length, 35); // Includes local files.
    const komga = 'b21fcfa9-8b46-439f-b060-31832aaf1931';
    const settings = {
      ...invoke(channels.EXTENSION.GET_SETTINGS, komga),
      'Address (with port)': 'http://127.0.0.1:9999',
    };
    invoke(channels.EXTENSION.SET_SETTINGS, komga, settings);
    assert.deepEqual(invoke(channels.EXTENSION.GET_SETTINGS, komga), settings);
    await handlers.get(channels.EXTENSION_MANAGER.RELOAD)({
      sender: {
        send: (channel) => {
          assert.equal(channel, channels.APP.LOAD_STORED_EXTENSION_SETTINGS);
        },
      },
    });
    assert.equal(invoke(channels.EXTENSION_MANAGER.GET_ALL).length, 35);
    delete process.env.RENSAI_SOURCES_PATH;
    await subject.exports.loadPlugins(window);
    assert.equal(invoke(channels.EXTENSION_MANAGER.GET_ALL).length, 1);
    window.destroy();
    assert.match(
      invoke(channels.EXTENSION_MANAGER.GET_LOCAL_PROVIDER_STATUS).error,
      /not configured/,
    );
    console.log(
      `PASS: Electron ${process.versions.electron}, Rensai-only source IPC handlers, settings, reload, and missing-provider handling.`,
    );
    clearTimeout(deadline);
    app.quit();
  })
  .catch((error) => {
    console.error(error);
    clearTimeout(deadline);
    app.exit(1);
  });

app.on('will-quit', () => rmSync(profile, { recursive: true, force: true }));
