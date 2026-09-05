// Offline Library proposal only. Disposable profile; no source or library connections.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const profile = mkdtempSync(path.join(tmpdir(), 'rensai-library-check-'));
const output = path.join(tmpdir(), 'rensai-design-review');
mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => {
  console.error('Library check timed out');
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
    await window.loadFile(path.resolve(__dirname, '../out/design-system/library.html'));
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
      await run(
        `(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)} || b.getAttribute('aria-label')===${JSON.stringify(label)});if(!button)throw Error('Missing button '+${JSON.stringify(label)});button.click();})()`,
      );
      await settle();
    };
    const screenshot = async (name) => {
      await settle();
      writeFileSync(path.join(output, name), (await window.webContents.capturePage()).toPNG());
    };
    const choose = async (label, option, menu = false) => {
      if (menu) {
        await run(
          `document.querySelector('[aria-label="${label}"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))`,
        );
        await settle();
      } else await click(label);
      await run(
        `(()=>{const el=[...document.querySelectorAll('[role="option"], [role="menuitemradio"], [role="menuitem"]')].find(el=>el.textContent.trim()===${JSON.stringify(option)});if(!el)throw Error('Missing option '+${JSON.stringify(option)});el.click();})()`,
      );
      await settle();
    };
    const count = () => run(() => document.querySelectorAll('.library-book').length);
    await until(`document.querySelectorAll('.library-book').length===16`);
    assert.equal(await run(() => document.querySelectorAll('.library-continue-item').length), 3);
    assert.equal(
      await run(() =>
        document
          .querySelector('[aria-label="The Last Train reading progress"]')
          .getAttribute('aria-valuenow'),
      ),
      '5',
    );
    assert.equal(
      await run(() =>
        document
          .querySelector('[aria-label="The Last Train reading progress"]')
          .getAttribute('aria-valuemax'),
      ),
      '12',
    );
    await screenshot('library-dark.png');
    await click('Switch theme');
    await screenshot('library-light.png');
    await click('Switch theme');
    await run(() => {
      const input = document.querySelector('[aria-label="Search library"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
        input,
        'no such title',
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    assert.equal(await count(), 0);
    await click('Clear search and filters');
    await click('Filters');
    await choose('Publication status', 'Ongoing');
    assert.equal(await count(), 10);
    await run(() =>
      [...document.querySelectorAll('[aria-label="Reading progress"] button')]
        .find((b) => b.textContent.startsWith('Caught up'))
        .click(),
    );
    await settle();
    assert.equal(await count(), 3, 'Ongoing series can be caught up');
    await click('Reset filters');
    await click('Filters');
    await choose('Library view', 'Compact grid', true);
    await screenshot('library-compact.png');
    await choose('Library view', '8 columns', true);
    assert.equal(
      await run(
        () =>
          getComputedStyle(document.querySelector('.library-book-grid')).gridTemplateColumns.split(
            ' ',
          ).length,
      ),
      8,
    );
    await choose('Library view', 'Automatic', true);
    await choose('Library view', 'Covers only', true);
    assert.equal(await run(() => document.querySelectorAll('.library-covers-menu').length), 16);
    await choose('Library view', 'List', true);
    await screenshot('library-list.png');
    await click('Select');
    await click('Select all shown series');
    await click('Assign category');
    // Dropdowns open through pointer/keyboard activation, not a synthetic click alone.
    await run(() =>
      [...document.querySelectorAll('button')]
        .find((b) => b.textContent.trim() === 'Assign category')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })),
    );
    await settle();
    await run(() =>
      [...document.querySelectorAll('[role="menuitem"]')]
        .find((e) => e.textContent.trim() === 'Favorites')
        .click(),
    );
    await settle();
    assert.ok(await run(() => review.saved().every((s) => s.categories.includes('favorites'))));
    await choose('Library view', 'Comfortable grid', true);
    await click('Continue');
    await until(`review.pathname==='/reader/sample-0/sample-0-chapter-5'`);
    await run(() =>
      [...document.querySelectorAll('a')].find((a) => a.textContent === 'Back to library').click(),
    );
    await until(`document.querySelectorAll('.library-book').length===16`);
    await click('Select');
    await click('Select all shown series');
    const footer = await run(() => ({
      top: document.querySelector('.library-bulk-actions').getBoundingClientRect().top,
      bottom: document.querySelector('.library-bulk-actions').getBoundingClientRect().bottom,
      height: innerHeight,
      scrollable:
        document.querySelector('.library-collection-scroll').scrollHeight >
        document.querySelector('.library-collection-scroll').clientHeight,
    }));
    assert.ok(footer.scrollable);
    assert.ok(footer.bottom <= footer.height);
    await run(() => {
      const body = document.querySelector('.library-collection-scroll');
      body.scrollTop = body.scrollHeight;
    });
    await settle();
    assert.equal(
      await run(() => document.querySelector('.library-bulk-actions').getBoundingClientRect().top),
      footer.top,
    );
    await screenshot('library-selection.png');
    await click('Mark read');
    assert.ok(
      await run(() => review.saved().every((s) => review.chapters(s.id).every((c) => c.read))),
    );
    assert.equal(await run(() => document.querySelectorAll('.library-continue-item').length), 0);
    await window.webContents.reload();
    await until(`document.querySelectorAll('.library-continue-item').length===3`);
    await run(() => {
      review.failNext = true;
    });
    await click('Refresh');
    await until(`document.querySelector('[role="alert"]')!==null`);
    assert.equal(await count(), 16);
    assert.equal(
      await run(() =>
        document.querySelector('.library-collection-scroll').getAttribute('aria-busy'),
      ),
      'false',
    );
    await click('Try again');
    await until(
      `document.querySelector('[role="alert"]')===null && document.querySelector('.library-collection-scroll').getAttribute('aria-busy')==='false'`,
    );
    await choose('Actions for The Last Train', 'Remove series', true);
    assert.ok(await run(() => document.querySelector('[role="dialog"]') !== null));
    assert.equal(await count(), 16);
    await click('Cancel');
    await choose('Actions for The Last Train', 'Remove series', true);
    await click('Remove from library');
    assert.equal(await count(), 15);
    assert.equal(await run(() => review.saved().some((s) => s.id === 'sample-0')), false);
    window.setSize(640, 900);
    await settle();
    assert.ok(await run(() => document.documentElement.scrollWidth <= innerWidth));
    await click('Select');
    await click('Select all shown series');
    assert.ok(
      await run(
        () =>
          document.querySelector('.library-bulk-actions').getBoundingClientRect().bottom <=
          innerHeight,
      ),
    );
    await screenshot('library-narrow.png');
    await click('Done');
    await run(() => review.empty());
    await settle();
    assert.ok(await run(() => document.body.innerText.includes('Add your first series')));
    assert.deepEqual(errors, []);
    console.log(
      `PASS: production Library themes, four views, saved column choice, actual chapter progress and reader route, immediate filters, fixed bulk actions, persistent mark-read/category/removal, rejected refresh/retry, narrow layout. Screenshots: ${output}`,
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
