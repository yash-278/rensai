// Capture the production dashboard and Library using only fictional fixture data.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'rensai-website-profile-'));
const output = path.join(os.tmpdir(), 'rensai-website-captures');
fs.mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => { console.error('Website capture timed out'); app.exit(1); }, 30000);
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1440, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  window.setContentSize(1440, 900);
  const errors = [];
  window.webContents.on('console-message', (_e, level, text) => { if (level === 3) errors.push(text); });
  window.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, cb) => cb({ cancel: true }));
  await window.loadFile(path.resolve(__dirname, '../out/design-system/library.html'), { query: { 'website-capture': '1' } });
  const run = source => window.webContents.executeJavaScript(`(${source.toString()})()`);
  const ready = await run(async () => {
    const end = performance.now() + 6000;
    while (performance.now() < end) {
      if (document.querySelectorAll('img').length >= 16 && [...document.images].every(img => img.complete && img.naturalWidth > 0)) return true;
      await new Promise(r => setTimeout(r, 40));
    }
    return false;
  });
  if (!ready) console.log(await run(() => ({ text: document.body.innerText, images: [...document.images].map(img => ({complete:img.complete, width:img.naturalWidth})) })), errors);
  assert.ok(ready, 'All fictional covers loaded');
  assert.ok(await run(() => document.querySelector('#titlebar').textContent.includes('Rensai')));
  assert.ok(await run(() => !document.body.innerText.includes('Offline page review')));
  assert.ok(await run(() => document.body.innerText.includes('Rensai v')));
  for (const theme of ['dark', 'light']) {
    await window.webContents.executeJavaScript(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`);
    await run(async () => {
      await document.fonts.ready;
      await Promise.all(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const screenshot = await window.webContents.capturePage();
    const size = screenshot.getSize();
    assert.equal(size.width / size.height, 1440 / 900);
    fs.writeFileSync(path.join(output, `library-${theme}.png`), screenshot.resize({ width: 1440, height: 900 }).toPNG());
  }
  assert.deepEqual(errors, []);
  console.log(`Captured production Library in both themes at 1440 x 900: ${output}`);
  window.destroy(); app.quit();
}).catch(error => { console.error(error); app.exit(1); });
app.on('will-quit', () => { clearTimeout(deadline); fs.rmSync(profile, { recursive: true, force: true }); });
