// Production Add Series, offline IPC fixtures, disposable profile, no desktop automation.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const ipc = require('../src/common/constants/ipcChannels.json');
const profile = mkdtempSync(path.join(tmpdir(), 'rensai-search-check-'));
const output = path.join(tmpdir(), 'rensai-design-review');
mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => {
  console.error('Search check timed out');
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
    await window.loadFile(path.resolve(__dirname, '../out/design-system/search.html'));
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
    const query = async (text) => {
      await run(`review.setText(${JSON.stringify(text)})`);
      await settle();
      assert.equal(
        await run(() => {
          const e = new Event('submit', { bubbles: true, cancelable: true });
          document.querySelector('form').dispatchEvent(e);
          return e.defaultPrevented;
        }),
        true,
        'Search prevents navigation',
      );
      await until(
        `document.querySelector('[aria-label="Series results"]').getAttribute('aria-busy')==='false'`,
      );
    };
    const requestCount = () =>
      run(
        `review.calls.filter(c=>[${JSON.stringify(ipc.EXTENSION.DIRECTORY)},${JSON.stringify(ipc.EXTENSION.SEARCH)}].includes(c.channel)).length`,
      );
    const pause = (ms) => run(`new Promise(resolve => setTimeout(resolve, ${ms}))`);
    const typeFilter = async (text) => {
      await run(
        `(async () => {const input=document.querySelector('#filter-author');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(text)});input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,20));})()`,
      );
    };
    const enterFilter = async () => {
      await run(() =>
        document
          .querySelector('#filter-author')
          .dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
          ),
      );
      await settle();
    };
    await until(`document.querySelectorAll('article').length===12`);
    assert.equal(await run(() => document.querySelectorAll('article').length), 12);
    assert.ok(await run(() => document.body.innerText.includes('In library')));
    const columns = await run(() => review.libraryColumns);
    const coverWidth = await run(
      () => document.querySelector('article img').getBoundingClientRect().width,
    );
    assert.ok(coverWidth >= 176 && coverWidth < 240, `Cover width ${coverWidth}`);
    assert.ok(
      await run(() => {
        const a = document.querySelector('article');
        return (
          a.querySelector('h2').getBoundingClientRect().top >=
          a.querySelector('img').getBoundingClientRect().bottom
        );
      }),
      'Title is below cover',
    );
    await click('Filters');
    assert.ok(
      await run(() => document.querySelector('aside[aria-label="Search filters"]') !== null),
    );
    await screenshot('add-series-dark.png');
    assert.equal(
      await run(() =>
        [...document.querySelectorAll('button')].some((b) => b.textContent === 'Apply filters'),
      ),
      false,
    );
    await run(() => {
      review.holdSearch = true;
      document.querySelector('#checkboxchapters').click();
    });
    await settle();
    assert.equal(
      await run(() => document.querySelectorAll('article').length),
      12,
      'Keep results visible during refresh',
    );
    assert.ok(
      await run(() =>
        document.querySelector('[role="status"]').textContent.includes('Updating results'),
      ),
    );
    assert.equal(
      await run(
        () => document.querySelectorAll('[data-cover-density] > [aria-hidden="true"]').length,
      ),
      0,
      'No appended skeletons during refresh',
    );
    await run(() => review.release());
    await until(`document.querySelector('[aria-label="Reset Has available chapters"]')!==null`);
    assert.equal(
      await run(
        `review.calls.filter(c=>c.channel===${JSON.stringify(ipc.EXTENSION.DIRECTORY)}).at(-1).args[2].chapters`,
      ),
      true,
    );
    await click('Genre');
    await run(() => document.querySelector('[aria-label="Adventure: Ignored"]').click());
    await settle();
    await run(() => document.querySelector('[aria-label="Adventure: Included"]').click());
    await settle();
    assert.ok(
      await run(() => document.querySelector('[aria-label="Adventure: Excluded"]') !== null),
    );
    await run(() =>
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
    );
    await settle();
    await until(`document.querySelector('[aria-label="Reset Genre"]')!==null`);
    let count = await requestCount();
    const duringTyping = await run(async () => {
      const input = document.querySelector('#filter-author');
      const write = (value) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const before = review.calls.length;
      write('A');
      await new Promise((r) => setTimeout(r, 150));
      write('Author');
      await new Promise((r) => setTimeout(r, 150));
      return review.calls.length - before;
    });
    assert.equal(duringTyping, 0, 'Text waits for typing to settle');
    await until(
      `review.calls.filter(c=>c.channel===${JSON.stringify(ipc.EXTENSION.DIRECTORY)}).at(-1).args[2].author==='Author'`,
    );
    assert.equal(await requestCount(), count + 1, 'Text changes coalesce into one request');
    count = await requestCount();
    await typeFilter('Enter now');
    await enterFilter();
    assert.equal(await requestCount(), count + 1, 'Enter applies immediately');
    await pause(450);
    assert.equal(await requestCount(), count + 1, 'Enter cancels the debounce');
    await typeFilter('After closing');
    await click('Close filters');
    await until(
      `review.calls.filter(c=>c.channel===${JSON.stringify(ipc.EXTENSION.DIRECTORY)}).at(-1).args[2].author==='After closing'`,
    );
    await run(() =>
      [...document.querySelectorAll('button')]
        .find((b) => b.textContent.startsWith('Filters'))
        .click(),
    );
    await settle();
    assert.equal(await run(() => document.querySelector('#filter-author').value), 'After closing');
    count = await requestCount();
    await typeFilter('Combined');
    await run(() => document.querySelector('#checkboxchapters').click());
    await settle();
    assert.equal(
      await requestCount(),
      count + 1,
      'Discrete selection immediately includes current text',
    );
    assert.equal(
      await run(
        `review.calls.filter(c=>c.channel===${JSON.stringify(ipc.EXTENSION.DIRECTORY)}).at(-1).args[2].author`,
      ),
      'Combined',
    );
    await pause(450);
    assert.equal(await requestCount(), count + 1);
    await typeFilter('Discard on reset');
    count = await requestCount();
    await click('Reset');
    assert.equal(await requestCount(), count + 1, 'Reset applies immediately');
    assert.equal(await run(() => document.querySelector('#filter-author').value), '');
    await pause(450);
    assert.equal(await requestCount(), count + 1, 'Reset cancels pending text');
    await run(() => {
      review.holdSearch = true;
    });
    await typeFilter('Old request');
    await enterFilter();
    await typeFilter('empty-filter');
    await run(() => review.release());
    await settle();
    assert.equal(
      await run(() =>
        document.querySelector('[aria-label="Series results"]').getAttribute('aria-busy'),
      ),
      'true',
      'Old response cannot end the pending refresh',
    );
    await until(`document.body.innerText.includes('No series found')`);
    await click('Reset');
    await until(`document.querySelectorAll('article').length===12`);
    await typeFilter('Cancel on source change');
    await run(() => review.setSource('second'));
    await until(`review.result.length>0 && review.result[0].extensionId==='second'`);
    count = await requestCount();
    await pause(450);
    assert.equal(await requestCount(), count, 'Source changes cancel pending text');
    await run(() => review.setSource('sample'));
    await until(`review.result.length>0 && review.result[0].extensionId==='sample'`);
    await click('Reset');
    await click('Close filters');
    await run(() => document.querySelector('[aria-label="Change cover density"]').click());
    await settle();
    assert.ok(
      (await run(() => document.querySelector('article img').getBoundingClientRect().width)) <
        coverWidth,
    );
    assert.equal(
      await run(() => review.libraryColumns),
      columns,
      'Cover density does not change Library preference',
    );
    await run(() => document.querySelector('[aria-label="Change cover density"]').click());
    await settle();
    await query('train');
    await run(() => review.setText('unsubmitted text'));
    await settle();
    await click('Load more');
    await until(`document.querySelectorAll('article').length===24`);
    const last = await run(
      `review.calls.filter(c=>c.channel===${JSON.stringify(ipc.EXTENSION.SEARCH)}).at(-1).args`,
    );
    assert.equal(last[1], 'train');
    assert.equal(last[2], 2);
    await run(() => {
      review.failNext = true;
    });
    await query('failure');
    assert.ok(
      await run(() =>
        document.querySelector('[role="alert"]').textContent.includes('Could not load results'),
      ),
    );
    await click('Try again');
    await until(`document.querySelectorAll('article').length===12`);
    await query('empty');
    assert.ok(await run(() => document.body.innerText.includes('No series found')));
    await run(() => {
      review.holdSearch = true;
      review.setText('race');
    });
    await settle();
    await run(() =>
      document
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    await run(() => review.setSource('second'));
    await until(`review.result.length>0 && review.result[0].extensionId==='second'`);
    await run(() => review.release());
    await settle();
    assert.ok(
      await run(() => review.result.every((s) => s.extensionId === 'second')),
      'Late results from previous source ignored',
    );
    await run(() => {
      review.holdDetails = true;
      document.querySelector('[aria-label="View The Last Train"]').click();
    });
    await settle();
    assert.equal(
      await run(() => document.querySelector('[role="dialog"] button[type="submit"]').disabled),
      true,
    );
    await click('Cancel');
    await run(() => document.querySelector('[aria-label="View Paper Moon"]').click());
    await until(
      `document.querySelector('[role="dialog"] input[placeholder="Title"]')?.value==='Paper Moon'`,
    );
    await run(() => review.releaseDetails());
    await settle();
    assert.equal(
      await run(() => document.querySelector('[role="dialog"] input[placeholder="Title"]').value),
      'Paper Moon',
      'Late details do not replace selected series',
    );
    await run(() => document.querySelector('[role="dialog"] button[type="submit"]').click());
    await settle();
    assert.equal(await run(() => review.queue.at(-1).series.title), 'Paper Moon');
    await run(() => {
      review.failDetails = true;
      document.querySelector('[aria-label="View A Quiet Orbit"]').click();
    });
    await until(`document.querySelector('[role="dialog"] [role="alert"]')!==null`);
    assert.equal(
      await run(() => document.querySelector('[role="dialog"] button[type="submit"]').disabled),
      true,
    );
    await click('Try again');
    await until(
      `document.querySelector('[role="dialog"] input[placeholder="Title"]')?.value==='A Quiet Orbit'`,
    );
    await click('Cancel');
    await run(() => {
      review.longDetails = true;
      document.querySelector('[aria-label="View Summer Postcards"]').click();
    });
    await until(`document.querySelector('#series-description')?.value.length>1000`);
    const checkDialogScroll = async () => {
      const geometry = await run(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const body = document.querySelector('[aria-label="Series details"]');
        const footer = document.querySelector('[aria-label="Series actions"]');
        const before = footer.getBoundingClientRect().top;
        body.scrollTop = body.scrollHeight;
        const description = document.querySelector('#series-description');
        description.scrollTop = description.scrollHeight;
        return {
          bodyScroll: body.scrollTop,
          descriptionScroll: description.scrollTop,
          footerMoved: footer.getBoundingClientRect().top !== before,
          outerScroll: dialog.scrollHeight - dialog.clientHeight,
          overflowX: body.scrollWidth - body.clientWidth,
          actionsVisible: [...footer.querySelectorAll('button')].every((button) => {
            const rect = button.getBoundingClientRect();
            return (
              rect.top >= 0 &&
              rect.bottom <= innerHeight &&
              rect.left >= 0 &&
              rect.right <= innerWidth
            );
          }),
          dialogTop: dialog.getBoundingClientRect().top,
        };
      });
      assert.ok(geometry.bodyScroll > 0, 'Long metadata scrolls inside the body');
      assert.ok(geometry.descriptionScroll > 0, 'Long description scrolls inside its field');
      assert.equal(geometry.footerMoved, false, 'Footer stays fixed when details scroll');
      assert.ok(geometry.outerScroll <= 1, 'Dialog itself does not scroll');
      assert.ok(geometry.overflowX <= 1, 'Long tags stay inside the content width');
      assert.ok(
        geometry.actionsVisible && geometry.dialogTop >= 0,
        'All actions fit within the window',
      );
    };
    await settle();
    await checkDialogScroll();
    await screenshot('add-series-dialog-long.png');
    window.setSize(640, 420);
    await settle();
    await checkDialogScroll();
    await screenshot('add-series-dialog-short.png');
    window.setSize(360, 420);
    await settle();
    await checkDialogScroll();
    await click('Cancel');
    await run(() => {
      review.longDetails = false;
    });
    window.setSize(1440, 1000);
    await settle();
    await run(() => document.documentElement.classList.remove('dark'));
    await screenshot('add-series-light.png');
    window.setSize(640, 900);
    await settle();
    await click('Filters');
    assert.ok(await run(() => document.querySelector('[role="dialog"]') !== null));
    assert.ok(await run(() => document.documentElement.scrollWidth <= innerWidth));
    await screenshot('add-series-narrow.png');
    await click('Close');
    assert.equal(await run(() => document.querySelector('[role="dialog"]') !== null), false);
    await run(() => review.setSource('9ef3242e-b5a0-4f56-bf2f-5e0c9f6f50ab'));
    await settle();
    assert.ok(await run(() => document.body.innerText.includes('Bring your own collection')));
    await click('Select directory');
    await until(`document.querySelector('[role="dialog"] input[placeholder="Title"]')!==null`);
    assert.equal(
      await run(
        () => document.querySelector('[role="dialog"] input[placeholder="Title"]').disabled,
      ),
      false,
      'Local metadata editable',
    );
    await click('Cancel');
    await run(() => document.querySelector('#checkboxMultiSeriesMode').click());
    await click('Select directory');
    await until(`document.querySelectorAll('article').length===2`);
    assert.deepEqual(errors, []);
    console.log(
      `PASS: actual Search component, layout/density, immediate filters, 400ms text debounce, Enter/Reset/source cancellation, refresh continuity, tag exclusion, form/pagination, error/retry/empty states, stale responses, add queue, narrow drawer, single/multi local import. Screenshots: ${output}`,
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
