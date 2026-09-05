// Render only the offline design preview in a disposable Electron profile.
const { app, BrowserWindow } = require('electron');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const profile = mkdtempSync(path.join(tmpdir(), 'rensai-design-check-'));
const output = process.env.DESIGN_CHECK_OUTPUT || path.join(tmpdir(), 'rensai-design-review');
mkdirSync(output, { recursive: true });
app.setPath('userData', profile);
const deadline = setTimeout(() => {
  console.error('Design check timed out');
  app.exit(1);
}, 30000);
app
  .whenReady()
  .then(async () => {
    const window = new BrowserWindow({
      show: false,
      width: 1440,
      height: 1100,
      webPreferences: { backgroundThrottling: false },
    });
    const errors = [];
    window.webContents.on('console-message', (_event, level, message) => {
      if (level === 3) errors.push(message);
    });
    await window.loadFile(path.resolve(__dirname, '../out/design-system/index.html'));
    window.webContents.debugger.attach('1.3');
    await window.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled', {
      enabled: true,
    });
    const run = (fn) => window.webContents.executeJavaScript(`(${fn.toString()})()`);
    const settle = () =>
      run(async () => {
        await document.fonts.ready;
      await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      });
    await settle();
    assert.ok(await run(() => document.body.innerText.includes('A library built around reading')));
    const report = [];
    for (const theme of ['dark', 'light']) {
      if (theme === 'light') {
        await run(() => document.querySelector('#theme-toggle').click());
        await settle();
      }
      assert.equal(
        await run(() => document.documentElement.classList.contains('dark')),
        theme === 'dark',
      );
      const checks = await run(() => {
        const rgb = (name) => {
          const el = document.createElement('span');
          el.style.color = `hsl(var(--${name}))`;
          document.body.append(el);
          const c = getComputedStyle(el)
            .color.match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number);
          el.remove();
          return c;
        };
        const luminance = (c) =>
          c
            .map((v) => {
              const normalized = v / 255;
              return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
            })
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        return [
          ['foreground', 'background'],
          ['muted-foreground', 'card'],
          ['primary-foreground', 'primary'],
          ['accent-foreground', 'accent'],
          ['success', 'success-subtle'],
          ['warning', 'warning-subtle'],
          ['danger', 'danger-subtle'],
          ['ring', 'background'],
          ['input', 'field'],
        ].map(([fg, bg]) => {
          const a = luminance(rgb(fg));
          const b = luminance(rgb(bg));
          return { fg, bg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
        });
      });
      for (const check of checks)
        assert.ok(
          check.ratio >= (['ring', 'input'].includes(check.fg) ? 3 : 4.5),
          `${theme} ${check.fg}/${check.bg}: ${check.ratio}`,
        );
      report.push({ theme, contrast: checks });
      assert.equal(
        await run(() =>
          Math.round(document.querySelector('#theme-toggle').getBoundingClientRect().height),
        ),
        36,
      );
      writeFileSync(
        path.join(output, `${theme}.png`),
        (await window.webContents.capturePage()).toPNG(),
      );
    }
    await run(() => document.querySelector('#density-toggle').click());
    await settle();
    assert.equal(
      await run(() =>
        Math.round(document.querySelector('#theme-toggle').getBoundingClientRect().height),
      ),
      32,
    );
    await run(() => document.querySelector('[aria-label="View The Last Train"]').click());
    await settle();
    assert.equal(await run(() => document.querySelector('[role="dialog"]') !== null), true);
    await run(() =>
      [...document.querySelectorAll('[role="dialog"] button')]
        .find((b) => b.textContent === 'Add to library')
        .click(),
    );
    await settle();
    assert.ok(
      await run(() => document.querySelector('[role="status"]').textContent.includes('added')),
    );
    await run(() =>
      [...document.querySelectorAll('nav button')]
        .find((b) => b.textContent === 'Components')
        .click(),
    );
    await settle();
    await run(() => document.querySelector('#example-title').focus());
    assert.equal(await run(() => document.activeElement.id), 'example-title');
    assert.notEqual(
      await run(() => getComputedStyle(document.querySelector('#example-title')).boxShadow),
      'none',
    );
    writeFileSync(
      path.join(output, 'components.png'),
      (await window.webContents.capturePage()).toPNG(),
    );
    window.setSize(640, 900);
    await settle();
    assert.equal(await run(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    writeFileSync(path.join(output, 'checks.json'), JSON.stringify(report, null, 2));
    console.log(
      `PASS: both themes, text and control contrast, 36/32px density, focus, detail/add interaction, narrow layout. Screenshots: ${output}`,
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
