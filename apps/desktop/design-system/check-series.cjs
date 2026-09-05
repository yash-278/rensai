// Offline Series details proposal only. Disposable profile; no source or library connections.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const profile = mkdtempSync(path.join(tmpdir(), 'rensai-series-check-'));
const output = path.join(tmpdir(), 'rensai-design-review');
mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => {
  console.error('Series check timed out');
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
    await window.loadFile(path.resolve(__dirname, '../out/design-system/series.html'));
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
    const input = async (selector, value) => {
      await run(
        `(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`,
      );
      await settle();
    };
    const scenario = async (value) => {
      await run(`review.scenario(${JSON.stringify(value)})`);
      await settle();
    };
    const escape = async () => {
      await run(() =>
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
      );
      await settle();
    };
    const count = () => run(() => document.querySelectorAll('tbody tr').length);
    await until(`document.querySelectorAll('tbody tr').length===20`);
    await until(`!document.body.innerText.includes('Checking…')`);
    assert.equal(await run(() => document.querySelector('progress').value), 19);
    assert.equal(await run(() => document.querySelector('progress').max), 42);
    await screenshot('series-dark.png');
    await click('Switch theme');
    await screenshot('series-light.png');
    await click('Switch theme');
    await run(() =>
      [...document.querySelectorAll('a')]
        .find((a) => a.textContent.includes('Continue reading'))
        .click(),
    );
    await until(`review.pathname==='/reader/sample-series/sample-series-ch-22'`);
    await run(() => review.navigate('/series/sample-series'));
    await until(`document.querySelectorAll('tbody tr').length===20`);
    await click('Select page');
    await click('Next page');
    await click('Select page');
    assert.ok(
      await run(() =>
        document.querySelector('.series-action-footer').textContent.includes('40 selected'),
      ),
    );
    await input('[aria-label="Search chapters"]', 'no match');
    assert.equal(await count(), 0);
    assert.ok(
      await run(() =>
        document.querySelector('.series-action-footer').textContent.includes('40 selected'),
      ),
    );
    await click('Mark read');
    assert.equal(await run(() => review.chapters().filter((c) => c.read).length), 44);
    await click('Reset filters');
    await run(() => review.navigate('/reader/sample-series/sample-series-ch-22'));
    await settle();
    await run(() => review.navigate('/series/sample-series'));
    await until(`document.querySelectorAll('tbody tr').length===20`);
    assert.equal(await run(() => document.querySelector('progress').value), 44);
    await choose('Chapters per page', '10 / page');
    await run(() => review.navigate('/reader/sample-series/sample-series-ch-22'));
    await settle();
    await run(() => review.navigate('/series/sample-series'));
    await until(`document.querySelectorAll('tbody tr').length===10`);
    await choose('Chapters per page', '20 / page');
    await click('Select chapter 47');
    await click('Sort chapters');
    await click('Mark unread');
    assert.equal(
      await run(() => review.chapters().find((c) => c.chapterNumber === '47').read),
      false,
    );
    await click('Sort chapters');
    await click('Sort chapters');
    await scenario('standard');
    await click('Select page');
    const before = await run(() => ({
      top: document.querySelector('.series-action-footer').getBoundingClientRect().top,
      bottom: document.querySelector('.series-action-footer').getBoundingClientRect().bottom,
      height: innerHeight,
      meta: document.querySelector('.series-metadata').getBoundingClientRect().top,
      scroll:
        document.querySelector('.series-chapter-scroll').scrollHeight >
        document.querySelector('.series-chapter-scroll').clientHeight,
    }));
    assert.ok(before.scroll);
    assert.ok(before.bottom <= before.height);
    await run(() => {
      const el = document.querySelector('.series-chapter-scroll');
      el.scrollTop = el.scrollHeight;
    });
    await settle();
    assert.equal(
      await run(() => document.querySelector('.series-action-footer').getBoundingClientRect().top),
      before.top,
    );
    assert.equal(
      await run(() => document.querySelector('.series-metadata').getBoundingClientRect().top),
      before.meta,
    );
    await screenshot('series-selection.png');
    await click('Done');
    await choose('Download status', 'Failed');
    assert.equal(await count(), 1);
    await choose('Actions for chapter 25', 'Retry download', true);
    await until(`document.querySelectorAll('tbody tr').length===0`);
    await choose('Download status', 'Queued');
    assert.equal(await count(), 2);
    await run(() => review.setTask(23));
    await choose('Download status', 'Downloading');
    assert.equal(await count(), 1);
    await run(() => review.complete());
    await choose('Download status', 'Available offline');
    await until(`document.querySelectorAll('tbody tr').length===11`);
    await run(() => {
      review.failStatus = true;
      review.setTask(26);
    });
    await until(`document.body.innerText.includes('Could not check downloaded chapters')`);
    await run(() => {
      review.failStatus = false;
    });
    await click('Retry status');
    await until(`!document.body.innerText.includes('Could not check downloaded chapters')`);
    await click('Reset filters');
    await scenario('standard');
    await input('[aria-label="Search chapters"]', '47');
    await click('Select page');
    await run(() => {
      review.failDownload = true;
    });
    await click('Download selected');
    await until(
      `document.body.innerText.includes('Download failed. Retry from the chapter menu.')`,
    );
    await click('Reset filters');
    await choose('Download status', 'Failed');
    await choose('Actions for chapter 22', 'Retry download', true);
    await click('Reset filters');
    await scenario('long');
    await click('Read more');
    const metaTop = await run(
      () => document.querySelector('.series-chapters').getBoundingClientRect().top,
    );
    assert.ok(
      await run(
        () =>
          document.querySelector('.series-metadata').scrollHeight >
          document.querySelector('.series-metadata').clientHeight,
      ),
    );
    await run(() => {
      const el = document.querySelector('.series-metadata');
      el.scrollTop = el.scrollHeight;
    });
    await settle();
    assert.equal(
      await run(() => document.querySelector('.series-chapters').getBoundingClientRect().top),
      metaTop,
    );
    await screenshot('series-long-metadata.png');
    await scenario('failure');
    await click('Refresh');
    await until(`document.body.innerText.includes('Could not refresh this series')`);
    assert.equal(await count(), 20);
    await click('Retry');
    await until(`!document.body.innerText.includes('Could not refresh this series')`);
    await scenario('empty');
    await until(`document.body.innerText.includes('No chapters yet')`);
    await screenshot('series-empty.png');
    await scenario('local');
    await choose('Series actions', 'Edit series', true);
    await input('input[placeholder="Title"]', 'Edited local title');
    await click('Save details');
    await until(`document.querySelector('h1').textContent==='Edited local title'`);
    assert.equal(await run(() => review.saved()[0].title), 'Edited local title');
    await choose('Series actions', 'Trackers', true);
    await until(`document.querySelector('[role="dialog"]')!==null`);
    assert.ok(
      await run(() =>
        document.querySelector('[role="dialog"]').textContent.includes('link your AniList account'),
      ),
    );
    await escape();
    await scenario('preview');
    await run(() =>
      document
        .querySelector('[aria-label="Series actions"]')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })),
    );
    await settle();
    assert.ok(
      await run(
        () =>
          ![...document.querySelectorAll('[role="menuitem"]')].some(
            (el) =>
              el.textContent.includes('Remove series') ||
              el.textContent.includes('Download chapters'),
          ),
      ),
    );
    await escape();
    await click('Add to library');
    assert.equal(await run(() => review.saved()[0].preview), false);
    await scenario('standard');
    await choose('Series actions', 'Download chapters', true);
    assert.ok(
      await run(() =>
        document.querySelector('[role="dialog"]').textContent.includes('Download unread chapters'),
      ),
    );
    await click('Cancel');
    await run(() =>
      document
        .querySelector('tbody tr')
        .dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, clientX: 600, clientY: 450 }),
        ),
    );
    await settle();
    assert.ok(
      await run(() =>
        [...document.querySelectorAll('[role="menuitem"]')].some(
          (el) => el.textContent === 'Select previous',
        ),
      ),
    );
    await run(() =>
      [...document.querySelectorAll('[role="menuitem"]')]
        .find((el) => el.textContent === 'Mark read')
        .click(),
    );
    await settle();
    assert.ok(await run(() => review.chapters().find((c) => c.chapterNumber === '48').read));
    window.setSize(900, 900);
    await settle();
    await run(() => {
      document.getElementById('root').style.setProperty('--titlebar-height', '24px');
      document.getElementById('root').style.marginTop = '24px';
    });
    await settle();
    assert.ok(
      await run(
        () =>
          document.querySelector('.series-action-footer').getBoundingClientRect().bottom <=
          innerHeight,
      ),
    );
    assert.ok(await run(() => document.querySelector('.series-chapter-scroll').clientHeight > 100));
    assert.ok(
      await run(
        () =>
          document.getElementById('root').scrollHeight <=
          document.getElementById('root').clientHeight,
      ),
    );
    await run(() => {
      document.getElementById('root').style.removeProperty('--titlebar-height');
      document.getElementById('root').style.marginTop = '0px';
    });
    window.setSize(640, 900);
    await settle();
    await click('Select page');
    assert.ok(await run(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(
      await run(
        () =>
          document.querySelector('.series-action-footer').getBoundingClientRect().bottom <=
          innerHeight,
      ),
    );
    await screenshot('series-narrow.png');
    await click('Series details');
    await screenshot('series-narrow-details.png');
    await click('Done');
    await choose('Series actions', 'Remove series', true);
    await click('Remove from library');
    await until(`review.saved().length===0`);
    await run(() => review.navigate('/series/missing'));
    await until(`document.body.innerText.includes('Series not found')`);
    assert.deepEqual(errors, []);
    console.log(
      `PASS: production Series details, reader route, stored progress and page size, stable selections, download queue/status/retry, metadata scroll, refresh failure, editing, trackers, range dialog, source preview guards, right-click, removal, and narrow layout. Screenshots: ${output}`,
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
