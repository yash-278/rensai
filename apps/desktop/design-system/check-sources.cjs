// Production Sources with synthetic settings and a disposable profile. No live sources.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const profile = mkdtempSync(path.join(tmpdir(), 'rensai-sources-check-'));
const output = path.join(tmpdir(), 'rensai-design-review');
mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => {
  console.error('Sources check timed out');
  app.exit(1);
}, 30000);
app
  .whenReady()
  .then(async () => {
    const window = new BrowserWindow({
      show: false,
      width: 1440,
      height: 1000,
      webPreferences: { backgroundThrottling: false },
    });
    const errors = [];
    window.webContents.on('console-message', (_e, level, message) => {
      if (level === 3) errors.push(message);
    });
    window.webContents.session.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*'] },
      (_details, callback) => callback({ cancel: true }),
    );
    await window.loadFile(path.resolve(__dirname, '../out/design-system/sources.html'));
    window.webContents.debugger.attach('1.3');
    await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
      enabled: true,
    });
    const run = (source) =>
      window.webContents
        .executeJavaScript(typeof source === 'function' ? `(${source.toString()})()` : source)
        .catch((error) => {
          console.error('Failed browser assertion:', String(source), errors);
          throw error;
        });
    const until = async (expression) => {
      const ok = await run(
        `(async () => { const deadline=performance.now()+3000; while(performance.now()<deadline) {if(${expression}) return true; await new Promise(r=>setTimeout(r,20));}return false;})()`,
      );
      if (!ok)
        console.log(
          await run(() => ({
            body: document.body.innerText,
            calls: window.review?.calls,
            resultCount: window.review?.result?.length,
          })),
        );
      assert.ok(ok, `Timed out: ${expression}; console errors: ${errors.join('; ')}`);
    };
    const settle = () =>
      run(async () => {
        await document.fonts.ready;
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        );
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      });
    const click = async (label) => {
      await until(
        `[...document.querySelectorAll('button, label')].some(b => (b.textContent.trim()===${JSON.stringify(label)} || b.getAttribute('aria-label')===${JSON.stringify(label)}) && !b.disabled && b.getClientRects().length && !b.closest('[role="dialog"][data-state="closed"]'))`,
      );
      await run(
        `(()=>{const button=[...document.querySelectorAll('button, label')].find(b=>(b.textContent.trim()===${JSON.stringify(label)} || b.getAttribute('aria-label')===${JSON.stringify(label)}) && !b.disabled && b.getClientRects().length && !b.closest('[role="dialog"][data-state="closed"]'));if(!button)throw Error('Missing button '+${JSON.stringify(label)}+' in '+document.body.innerText);button.click();})()`,
      );
      await settle();
    };
    const screenshot = async (name) => {
      await settle();
      writeFileSync(path.join(output, name), (await window.webContents.capturePage()).toPNG());
    };
    const input = async (id, value) => {
      await run(
        `(()=>{const el=document.querySelector(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      );
      await settle();
    };
    const scenario = async (value) => {
      await run(
        `(()=>{const el=document.querySelector('[aria-label="Review scenario"]');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
      await until(
        value === 'provider-error'
          ? `document.querySelector('.sources-provider-error[role="alert"]')`
          : `document.querySelectorAll('.sources-row').length===10`,
      );
      await settle();
    };
    await until(`document.querySelectorAll('.sources-row').length===10`);
    await screenshot('sources-dark.png');
    await click('Switch theme');
    await screenshot('sources-light.png');
    await click('Switch theme');
    assert.equal(await run(() => document.querySelector('#source-field-0').type), 'password');
    await click('Help for API key');
    await until(`document.querySelector('[role="tooltip"]')`);
    await screenshot('sources-help.png');
    await window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
    await settle();
    await input('#source-field-0', 'sample-review-key');
    await click('Show api key');
    assert.equal(await run(() => document.querySelector('#source-field-0').type), 'text');
    await click('Configure MangaDex');
    assert.ok(
      await run(() =>
        document.querySelector('[role="dialog"]').textContent.includes('Discard unsaved changes'),
      ),
    );
    await click('Keep editing');
    assert.equal(
      await run(() => document.querySelector('#source-field-0').value),
      'sample-review-key',
    );
    await click('Save changes');
    await until(`document.querySelector('.sources-key-state').textContent.includes('Key saved')`);
    assert.equal(await run(() => document.querySelector('#source-field-0').type), 'password');
    assert.ok(
      await run(() =>
        document.querySelector('.sources-key-state').textContent.includes('not been verified'),
      ),
    );
    assert.ok(
      await run(() =>
        window.review.persisted(window.review.ids.nhentai).includes('sample-review-key'),
      ),
    );
    assert.equal(
      await run(
        () => window.review.calls.filter((c) => c.channel === 'extension-setSettings').length,
      ),
      1,
    );
    await click('Reload sources');
    await until(`document.querySelector('#source-field-0')?.value==='sample-review-key'`);
    await click('Configure MangaDex');
    await click('Data saver');
    await click('Cancel');
    assert.equal(
      await run(() => document.querySelector('[role="switch"]').getAttribute('aria-checked')),
      'false',
    );
    await click('With settings');
    assert.equal(await run(() => document.querySelectorAll('.sources-row').length), 3);
    await click('Needs setup');
    assert.equal(await run(() => document.querySelectorAll('.sources-row').length), 1);
    await click('All');
    await input('[aria-label="Search sources"]', 'French');
    assert.equal(await run(() => document.querySelectorAll('.sources-row').length), 1);
    await input('[aria-label="Search sources"]', 'no match');
    await click('Clear filters');
    await click('Configure MangaPill');
    assert.ok(
      await run(() =>
        document.querySelector('.sources-detail').textContent.includes('No settings needed'),
      ),
    );
    await scenario('settings-error');
    await screenshot('sources-settings-error.png');
    await click('Retry settings');
    assert.ok(await run(() => !!document.querySelector('#source-field-0')));
    await scenario('save-error');
    await input('#source-field-0', 'sample-retry-key');
    await click('Save changes');
    await until(`document.querySelector('[role="alert"]')`);
    assert.equal(
      await run(() => document.querySelector('#source-field-0').value),
      'sample-retry-key',
    );
    await click('Save changes');
    await until(`!document.querySelector('[role="alert"]')`);
    await input('#source-field-0', 'sample-persist-failure');
    await run(() => {
      window.review.failPersist = true;
    });
    await click('Save changes');
    await until(`document.querySelector('[role="alert"]')`);
    assert.ok(
      await run(() =>
        document.querySelector('[role="alert"]').textContent.includes('applied for this session'),
      ),
    );
    assert.ok(
      await run(
        () =>
          !window.review.persisted(window.review.ids.nhentai).includes('sample-persist-failure'),
      ),
    );
    await run(() => {
      window.review.failPersist = false;
    });
    await click('Save changes');
    await until(`!document.querySelector('[role="alert"]')`);
    await scenario('provider-error');
    await screenshot('sources-provider-error.png');
    assert.equal(await run(() => document.querySelectorAll('.sources-row').length), 0);
    await click('Try again');
    await until(`document.querySelectorAll('.sources-row').length===10`);
    await scenario('long');
    await click('Configure Komga');
    await input('#source-field-0', 'https://sample.invalid');
    const footerTop = await run(
      () => document.querySelector('.sources-detail-footer').getBoundingClientRect().top,
    );
    await run(() => {
      document.querySelector('.sources-detail-scroll').scrollTop = 900;
    });
    assert.equal(
      await run(() => document.querySelector('.sources-detail-footer').getBoundingClientRect().top),
      footerTop,
    );
    await screenshot('sources-long.png');
    await click('Reload sources');
    await click('Discard changes');
    await until(`document.querySelector('#source-field-0')?.value===''`);
    await scenario('standard');
    window.setSize(640, 800);
    await settle();
    assert.ok(await run(() => document.documentElement.scrollWidth <= innerWidth));
    await screenshot('sources-narrow.png');
    await click('Configure nhentai');
    await until(`document.querySelector('.sources-mobile-detail')`);
    await input('#source-field-0', 'sample-mobile-key');
    assert.ok(
      await run(
        () =>
          document.querySelector('.sources-detail-footer').getBoundingClientRect().bottom <=
          innerHeight,
      ),
    );
    await screenshot('sources-narrow-settings.png');
    await click('Close');
    await click('Keep editing');
    assert.ok(await run(() => !!document.querySelector('#source-field-0')));
    await click('Close');
    await click('Discard changes');
    await until(`!document.querySelector('[role="dialog"]')`);
    await scenario('long');
    await click('Configure Komga');
    window.setSize(360, 600);
    await settle();
    await input('#source-field-0', 'https://sample.invalid');
    await run(() => {
      document.querySelector('.sources-detail-scroll').scrollTop = 900;
    });
    assert.ok(
      await run(
        () =>
          document.querySelector('.sources-detail-footer').getBoundingClientRect().bottom <=
          innerHeight,
      ),
    );
    assert.ok(
      await run(
        () =>
          document.querySelector('.sources-mobile-detail').scrollWidth <=
          document.querySelector('.sources-mobile-detail').clientWidth,
      ),
    );
    await screenshot('sources-small-settings.png');
    assert.deepEqual(errors, []);
    console.log(
      `PASS: Production Sources persistence, selected-source writes, reload restoration, storage failure, themes, masked key/help, explicit save/cancel, unsaved edits, filters/search, settings/save/provider failures and retry, fixed footer, narrow dialog. Screenshots: ${output}`,
    );
    clearTimeout(deadline);
    window.destroy();
    app.quit();
  })
  .catch((error) => {
    console.error(error);
    clearTimeout(deadline);
    app.exit(1);
  });
app.on('will-quit', () => rmSync(profile, { recursive: true, force: true }));
