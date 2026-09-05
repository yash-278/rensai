// Production Settings. Disposable profile, synthetic IPC and storage, no network.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const profile = mkdtempSync(path.join(tmpdir(), 'rensai-settings-check-'));
const output = path.join(tmpdir(), 'rensai-design-review');
mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => {
  console.error('Settings check timed out');
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
      (_details, cb) => cb({ cancel: true }),
    );
    await window.loadFile(path.resolve(__dirname, '../out/design-system/settings.html'));
    window.webContents.debugger.attach('1.3');
    await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
      enabled: true,
    });
    const run = (source) =>
      window.webContents.executeJavaScript(
        typeof source === 'function' ? `(${source.toString()})()` : source,
      );
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
    const until = async (expression) => {
      assert.ok(
        await run(
          `(async()=>{const end=performance.now()+3000;while(performance.now()<end){if(${expression})return true;await new Promise(r=>setTimeout(r,20));}return false;})()`,
        ),
        `Timed out: ${expression}. ${errors.join('; ')}`,
      );
    };
    const click = async (label) => {
      const match = `[...document.querySelectorAll('button, a')].find(b => (b.textContent.trim()===${JSON.stringify(label)} || b.getAttribute('aria-label')===${JSON.stringify(label)} || document.getElementById(b.getAttribute('aria-labelledby'))?.textContent===${JSON.stringify(label)}) && !b.disabled && !b.closest('[aria-hidden="true"], [inert]') && b.getClientRects().length && !b.closest('[role="dialog"][data-state="closed"]'))`;
      await until(match);
      await run(`(()=>{const b=${match}; b.focus(); b.click();})()`);
      await settle();
    };
    const input = async (selector, value) => {
      await run(
        `(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      );
      await settle();
    };
    const choose = async (id, value) => {
      await run(
        `(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
      await settle();
    };
    const key = async (keyCode) => {
      window.webContents.sendInputEvent({ type: 'keyDown', keyCode });
      window.webContents.sendInputEvent({ type: 'keyUp', keyCode });
      await settle();
    };
    const screenshot = async (name) => {
      await settle();
      writeFileSync(path.join(output, name), (await window.webContents.capturePage()).toPNG());
    };
    const layout = async () => {
      const result = await run(() => {
        const dialog = document.querySelector('.settings-dialog');
        const footer = document.querySelector('.settings-footer').getBoundingClientRect();
        const scroll = document.querySelector('.settings-scroll');
        const bounds = scroll.getBoundingClientRect();
        const header = document.querySelector('.settings-header').getBoundingClientRect();
        return {
          noOverflow:
            dialog.scrollWidth <= dialog.clientWidth + 1 &&
            scroll.scrollWidth <= scroll.clientWidth + 1 &&
            document.documentElement.scrollWidth <= innerWidth,
          footerVisible:
            footer.top >= bounds.bottom - 1 && footer.bottom <= innerHeight && footer.top > 0,
          headerVisible: header.top >= 0 && header.bottom <= bounds.top + 1,
          scrollable: scroll.scrollHeight > scroll.clientHeight,
          footerTop: footer.top,
        };
      });
      assert.ok(result.noOverflow, 'No horizontal overflow');
      assert.ok(result.footerVisible, 'Footer remains visible below scroll area');
      assert.ok(result.headerVisible, 'Header remains visible above scroll area');
      return result;
    };
    await until(`document.querySelectorAll('.settings-navigation button').length===6`);
    await settle();
    await screenshot('settings-dark.png');
    await layout();
    await click('Light');
    assert.equal(await run(() => document.documentElement.classList.contains('dark')), false);
    await screenshot('settings-light.png');
    await click('Dark');
    await input('[aria-label="Search settings"]', 'chapter');
    assert.equal(
      await run(() => document.querySelectorAll('[data-preference="autoProgress"]').length),
      1,
    );
    await click('Update chapter progress automatically');
    await click('Clear settings search');
    await click('Trackers');
    assert.equal(
      await run(() => document.getElementById('autoProgress').getAttribute('aria-checked')),
      'false',
    );
    await run(() => document.querySelector('[data-preference="MyAnimeList"] button').click());
    await input('#tracker-code-MyAnimeList', 'sample-code');
    await click('Connect account');
    assert.match(
      await run(() => document.querySelector('[data-preference="MyAnimeList"]').textContent),
      /Connected as sample_reader/,
    );
    await click('General');
    await input('#backupCount', '0');
    await key('Enter');
    await until(`document.querySelector('#backupCount-error')`);
    await input('#backupCount', '14');
    await key('Enter');
    assert.equal(
      await run(() => document.getElementById('backupCount').getAttribute('aria-invalid')),
      'false',
    );
    await click('Restore…');
    await click('Cancel');
    await click('Restore…');
    await click('Choose backup and restore');
    await until(`document.body.textContent.includes('Library backup restored.')`);
    await click('Daily backups');
    assert.equal(
      await run(() => document.querySelector('#backupCount').matches(':disabled')),
      true,
    );
    await click('Library');
    await click('Choose folder…');
    await settle();
    await screenshot('settings-library.png');
    assert.match(
      await run(() => document.querySelector('.settings-folder').textContent),
      /Translated editions/,
    );
    await click('Reader');
    assert.equal(await run(() => document.getElementById('offset').disabled), true);
    await click('Double page');
    assert.equal(await run(() => document.getElementById('offset').disabled), false);
    await click('Fit to width');
    await click('Fit to height');
    assert.equal(await run(() => document.getElementById('stretch').disabled), true);
    await run(() => {
      document.querySelector('.settings-scroll').scrollTop = 0;
    });
    await screenshot('settings-reader.png');
    await click('Shortcuts');
    await click('Change shortcut for Turn page right');
    await key('Escape');
    assert.ok(await run(() => document.querySelector('.settings-dialog[data-state="open"]')));
    assert.equal(await run(() => document.querySelector('[data-recording="true"]')), null);
    await click('Change shortcut for Turn page right');
    await run(() => {
      window.backgroundKeyEvents = 0;
      for (const type of ['keydown', 'keyup', 'keypress']) document.addEventListener(type, () => { window.backgroundKeyEvents++; });
    });
    await key('J');
    assert.equal(await run(() => window.backgroundKeyEvents), 0, 'Settings consumes reader keyboard events');
    assert.match(
      await run(
        () =>
          document.querySelector('[aria-label="Change shortcut for Turn page right"]').textContent,
      ),
      /J/,
    );
    await click('Reset shortcut for Turn page right');
    assert.equal(
      await run(
        () =>
          document.querySelector('[aria-label="Change shortcut for Turn page right"]').textContent,
      ),
      'Right',
    );
    await screenshot('settings-shortcuts.png');
    await input('[aria-label="Search settings"]', 'nothing-matches-this');
    await until(`document.querySelector('.settings-empty')`);
    await click('Clear search');
    for (const [width, height] of [
      [640, 480],
      [360, 420],
    ]) {
      window.setContentSize(width, height);
      await settle();
      await choose('settings-section', 'shortcuts');
      const before = await layout();
      assert.ok(before.scrollable);
      await run(() => {
        const e = document.querySelector('.settings-scroll');
        e.scrollTop = e.scrollHeight;
      });
      const after = await layout();
      assert.equal(after.footerTop, before.footerTop);
      await screenshot(`settings-${width}.png`);
      await choose('settings-section', 'library');
      await run(() => {
        const e = document.querySelector('.settings-scroll');
        e.scrollTop = e.scrollHeight;
      });
      await layout();
      await screenshot(`settings-folder-${width}.png`);
    }
    await click('Done');
    await until(`!document.querySelector('.settings-dialog[data-state="open"]')`);
    await click('Open settings');
    await choose('settings-section', 'general');
    assert.equal(await run(() => document.getElementById('backupCount').value), '14');
    assert.ok(
      await run(() =>
        Object.entries(localStorage).some(
          ([key, value]) => key.includes('autoBackupCount') && value === '14',
        ),
      ),
      'Preference persisted',
    );
    window.setContentSize(1440, 1000);
    await settle();
    await click('Done');
    await click('Open reader settings');
    await until(`document.querySelector('.settings-section-heading h2').textContent==='Reader'`);
    await click('Integrations');
    await click('Share reading activity');
    await click('Open Sources');
    await until(`window.review.pathname==='/plugins'`);
    await until(`!document.querySelector('.settings-dialog[data-state="open"]')`);
    await click('Open settings');
    await click('Library');
    await click('Use default');
    await run(() => {
      window.review.cancelPicker = true;
    });
    await click('Choose folder…');
    assert.ok(
      await run(() =>
        document.querySelector('.settings-folder').textContent.includes('/Users/sample/'),
      ),
    );
    await run(() => {
      window.review.failNext = 'show-open-dialog';
    });
    await click('Choose folder…');
    await until(`document.querySelector('.settings-folder [role="alert"]')`);
    await click('Choose folder…');
    await until(`!document.querySelector('.settings-folder [role="alert"]')`);
    await click('General');
    await click('Create backup');
    await until(`window.review.exports===1`);
    await run(() => {
      window.review.invalidBackup = true;
    });
    await click('Restore…');
    await click('Choose backup and restore');
    await until(`document.querySelector('.settings-action-dialog [role="alert"]')`);
    await run(() => {
      window.review.invalidBackup = false;
    });
    await click('Choose backup and restore');
    await until(`!document.querySelector('.settings-action-dialog[data-state="open"]')`);
    assert.ok(
      await run(() =>
        Object.values(localStorage).some((value) => value.includes('settings-restored-series')),
      ),
    );
    await click('Trackers');
    await until(
      `document.querySelector('[data-preference="MyAnimeList"]').textContent.includes('Connected as sample_reader')`,
    );
    await run(() => document.querySelector('[data-preference="MyAnimeList"] button').click());
    await click('Disconnect account');
    await until(
      `document.querySelector('[data-preference="MyAnimeList"]').textContent.includes('Not connected')`,
    );
    await run(() => document.querySelector('[data-preference="MyAnimeList"] button').click());
    await input('#tracker-code-MyAnimeList', 'bad');
    await click('Connect account');
    await until(`document.querySelector('.settings-action-dialog [role="alert"]')`);
    assert.equal(await run(() => window.review.tokens.MyAnimeList), '');
    await input('#tracker-code-MyAnimeList', 'sample-code');
    await run(() => {
      window.review.failNext = 'tracker-getUsername';
    });
    await click('Connect account');
    await until(`document.querySelector('.settings-action-dialog [role="alert"]')`);
    assert.equal(
      await run(() => window.review.tokens.MyAnimeList),
      '',
      'Failed verification restores previous token',
    );
    await click('Connect account');
    await until(
      `document.querySelector('[data-preference="MyAnimeList"]').textContent.includes('Connected as sample_reader')`,
    );
    await run(() => document.querySelector('[data-preference="MangaUpdates"] button').click());
    await input('#tracker-user-MangaUpdates', 'sample-user');
    await input('#tracker-password-MangaUpdates', 'sample-password');
    assert.equal(
      await run(() => document.getElementById('tracker-password-MangaUpdates').type),
      'password',
    );
    await click('Connect account');
    await until(
      `document.querySelector('[data-preference="MangaUpdates"]').textContent.includes('Connected as sample_reader')`,
    );
    await screenshot('settings-trackers.png');
    await window.reload();
    await until(`document.querySelector('.settings-dialog')`);
    await click('Reader');
    assert.equal(
      await run(() => document.getElementById('fitWidth').getAttribute('aria-checked')),
      'false',
      'Preference survives renderer reload',
    );
    assert.deepEqual(errors, []);
    console.log(
      'Production Settings passed: six sections, editable cross-section search, themes, numeric validation, dependent controls, shortcuts, sample actions, session state, fixed scrolling at 1440/640/360 widths.',
    );
    console.log(`Screenshots: ${output}`);
    window.destroy();
    app.quit();
  })
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
app.on('will-quit', () => {
  clearTimeout(deadline);
  rmSync(profile, { recursive: true, force: true });
});
