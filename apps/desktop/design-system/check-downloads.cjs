// Production Downloads with synthetic IPC/files and a disposable profile. No live sources.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const profile = mkdtempSync(path.join(tmpdir(), 'rensai-downloads-check-'));
const output = path.join(tmpdir(), 'rensai-design-review');
mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => {
  console.error('Downloads check timed out');
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
    await window.loadFile(path.resolve(__dirname, '../out/design-system/downloads.html'));
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
    const search = async (value) => {
      await run(
        `(()=>{const el=document.querySelector('[aria-label="Search downloads"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      );
      await settle();
    };
    const queueCount = () => run(() => document.querySelectorAll('.downloads-queue-row').length);
    const reset = async (value = 'standard') => {
      await run(`window.review.scenario(${JSON.stringify(value)})`);
      await settle();
    };
    await until(
      `document.querySelectorAll('.downloads-queue-row').length===14 && document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')==='24'`,
    );
    await screenshot('downloads-dark.png');
    await click('Switch theme');
    await screenshot('downloads-light.png');
    await click('Switch theme');
    await click('Pause queue');
    assert.ok(
      await run(
        () =>
          [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Pausing…'))
            .disabled,
      ),
    );
    await run(() => window.review.advance());
    await until(`!window.review.state().current`);
    assert.equal(await run(() => window.review.state().queue[0].page), 25);
    await screenshot('downloads-paused.png');
    await click('Resume queue');
    await until(
      `document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')==='25'`,
    );
    await run(() => window.review.complete());
    await until(
      `window.review.state().current?.chapter.chapterNumber==='23' && document.querySelector('[aria-label="Downloaded view"]').textContent.includes('49')`,
    );
    assert.equal(await queueCount(), 13);
    await reset();
    await choose('Actions for chapter 24', 'Move up', true);
    assert.equal(await run(() => window.review.state().queue[0].chapter.chapterNumber), '24');
    await click('Select The Last Train chapter 24');
    await click('Failed (2)');
    assert.equal(await queueCount(), 2);
    assert.ok(
      await run(() =>
        document.querySelector('.downloads-footer').textContent.includes('1 selected'),
      ),
    );
    await screenshot('downloads-failed.png');
    await click('Retry');
    assert.equal(await run(() => window.review.state().errors.length), 1);
    assert.equal(
      await run(() => window.review.state().queue.at(-1).downloadsDir),
      '/offline-review',
    );
    await click('All');
    await click('Clear queued');
    await click('Cancel');
    assert.equal(await run(() => window.review.state().queue.length), 13);
    await click('Clear queued');
    await click('Remove chapters');
    assert.equal(await run(() => window.review.state().queue.length), 0);
    assert.equal(await run(() => window.review.state().current.chapter.chapterNumber), '22');
    assert.equal(await run(() => window.review.state().errors.length), 1);
    await reset('paused');
    await click('All');
    await click('Select The Last Train chapter 23');
    await search('no match');
    await click('Remove selected');
    await click('Remove chapters');
    assert.equal(await run(() => window.review.state().queue.length), 11);
    await search('');
    await click('Downloaded view');
    await until(`document.querySelectorAll('.downloads-saved-group').length===4`);
    assert.equal(await run(() => document.querySelectorAll('.downloads-saved-row').length), 12);
    const before = await run(() => ({
      library: window.review.saved(),
      chapters: window.review.chapters(),
    }));
    await screenshot('downloads-saved.png');
    await click('Select The Last Train');
    await search('Summer Postcards');
    assert.ok(
      await run(() =>
        document.querySelector('.downloads-footer').textContent.includes('12 selected'),
      ),
    );
    await click('Delete downloaded');
    await click('Cancel');
    assert.equal(
      await run(
        () => window.review.calls.filter((c) => c.channel.includes('delete-downloaded')).length,
      ),
      0,
    );
    await run(() => {
      window.review.failDelete = ['book-0-ch-1'];
    });
    await click('Delete downloaded');
    await click('Delete files');
    await until(`!document.querySelector('[role="dialog"]')`);
    assert.ok(
      await run(() =>
        document.querySelector('[role="alert"]').textContent.includes('Could not delete 1'),
      ),
    );
    assert.ok(
      await run(() =>
        document.querySelector('.downloads-footer').textContent.includes('1 selected'),
      ),
    );
    assert.deepEqual(
      await run(() => ({ library: window.review.saved(), chapters: window.review.chapters() })),
      before,
    );
    assert.equal(await run(() => window.review.disk()['/offline-review'].length), 37);
    await run(() => {
      window.review.failDelete = [];
    });
    await click('Delete downloaded');
    await click('Delete files');
    await until(`!document.querySelector('[role="dialog"]')`);
    assert.equal(await run(() => window.review.disk()['/offline-review'].length), 36);
    await click('Read Summer Postcards chapter 1');
    assert.equal(await run(() => window.review.pathname), '/reader/book-1/book-1-ch-1');
    await reset('paused');
    await click('Downloaded view');
    await run(() => {
      window.review.failScan = true;
    });
    await click('Refresh downloaded');
    await until(`document.querySelector('[role="alert"]')`);
    assert.equal(await run(() => document.querySelectorAll('.downloads-saved-group').length), 4);
    await screenshot('downloads-refresh-error.png');
    await run(() => {
      window.review.failScan = false;
    });
    await click('Try again');
    await until(`!document.querySelector('[role="alert"]')`);
    // An old directory scan must not replace the newer directory's inventory.
    await run(() => {
      window.review.holdScan = true;
    });
    await click('Refresh downloaded');
    await run(() => {
      window.review.setDirectory('/alternate-review');
    });
    await settle();
    await run(() => {
      window.review.holdScan = false;
      window.review.flushScans();
    });
    await until(
      `document.querySelector('[aria-label="Downloaded view"]').textContent.includes('2')`,
    );
    assert.equal(await run(() => document.querySelectorAll('.downloads-saved-group').length), 1);
    await click('Select shown chapters');
    await click('Delete downloaded');
    await click('Delete files');
    await until(`!document.querySelector('[role="dialog"]')`);
    assert.equal(await run(() => window.review.disk()['/alternate-review'].length), 0);
    assert.equal(await run(() => window.review.disk()['/offline-review'].length), 48);
    // A deletion already confirmed for one folder must not erase another folder's view.
    await reset('paused');
    await click('Downloaded view');
    await until(`document.querySelectorAll('.downloads-saved-row').length===12`);
    await click('Select The Last Train chapter 1');
    await run(() => { window.review.holdDelete = true; });
    await click('Delete downloaded'); await click('Delete files');
    await until(`window.review.pendingDeletes.length===1`);
    await run(() => window.review.setDirectory('/alternate-review'));
    await until(`document.querySelector('[aria-label="Downloaded view"]').textContent.includes('2')`);
    await run(() => { window.review.holdDelete = false; window.review.flushDeletes(); });
    await settle();
    assert.equal(await run(() => window.review.disk()['/offline-review'].length), 47);
    assert.equal(await run(() => window.review.disk()['/alternate-review'].length), 2);
    assert.ok(await run(() => document.querySelector('[aria-label="Downloaded view"]').textContent.includes('2')));
    await reset('empty');
    await click('Queue view');
    assert.ok(await run(() => document.body.innerText.includes('Your queue is empty')));
    await screenshot('downloads-empty.png');
    await click('Downloaded view');
    assert.ok(await run(() => document.body.innerText.includes('Take your library offline')));
    await reset();
    await click('Queue view');
    await click('Select shown chapters');
    const footer = await run(
      () => document.querySelector('.downloads-footer').getBoundingClientRect().top,
    );
    await run(() => {
      document.querySelector('.downloads-list').scrollTop = 500;
    });
    assert.equal(
      await run(() => document.querySelector('.downloads-footer').getBoundingClientRect().top),
      footer,
    );
    window.setSize(640, 900);
    await settle();
    assert.ok(await run(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(
      await run(
        () =>
          document.querySelector('.downloads-footer').getBoundingClientRect().bottom <= innerHeight,
      ),
    );
    assert.ok(await run(() => document.querySelector('.downloads-list').clientHeight > 100));
    await screenshot('downloads-narrow.png');
    assert.deepEqual(errors, []);
    console.log(
      `PASS: Production Downloads themes, actual pause/resume and completion, queue order/removal/retry, filtered selection, confirmed partial deletion, library preservation, reader routing, refresh errors, directory races, fixed actions and narrow layout. Screenshots: ${output}`,
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
