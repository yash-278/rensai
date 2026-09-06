const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const JSZip = require('jszip');
const { installSourceBundle, installedSourcePath, fetchSourceRelease, fetchSourceBundle, isNewerSourceVersion } = require('../scripts/source-update-module.cjs');

async function bundle(version = '0.1.0', extra = {}) {
  const zip = new JSZip();
  zip.file('package.json', JSON.stringify({ name: '@rensai/sources', version, rensaiApiVersion: 1, main: './src/index.js' }));
  zip.file('src/index.js', 'exports.version = ' + JSON.stringify(version));
  for (const [name, text] of Object.entries(extra)) zip.file(name, text);
  const bytes = await zip.generateAsync({ type: 'nodebuffer' });
  return { bytes, release: { version, apiVersion: 1, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') } };
}
const workspace = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rensai-update-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
};

test('updates independently and retains the old provider files for active readers', async t => {
  const root = workspace(t);
  assert.equal(installedSourcePath(root), undefined);
  const first = await bundle();
  const old = await installSourceBundle(root, first.release, first.bytes, dir => assert.equal(require(path.join(dir, 'src/index.js')).version, '0.1.0'));
  const next = await bundle('0.2.0');
  const current = await installSourceBundle(root, next.release, next.bytes, () => {});
  assert.equal(installedSourcePath(root), current);
  assert.notEqual(old, current);
  assert.ok(fs.existsSync(path.join(old, 'src/index.js')));
  assert.equal(isNewerSourceVersion('0.10.0', '0.2.0'), true);
  assert.equal(isNewerSourceVersion('0.1.0', '0.2.0'), false);
});

test('corrupt, incompatible, and unloadable updates leave the working pointer untouched', async t => {
  const root = workspace(t);
  const good = await bundle();
  const current = await installSourceBundle(root, good.release, good.bytes, () => {});
  const next = await bundle('0.2.0');
  await assert.rejects(installSourceBundle(root, next.release, Buffer.from('broken'), () => {}), /checksum/);
  await assert.rejects(installSourceBundle(root, { ...next.release, apiVersion: 2 }, next.bytes, () => {}), /newer desktop/);
  await assert.rejects(installSourceBundle(root, next.release, next.bytes, () => { throw Error('missing dependency'); }), /missing dependency/);
  assert.equal(installedSourcePath(root), current);
  assert.ok(fs.readdirSync(path.join(root, 'versions')).every(name => !name.endsWith('.partial')));
});

test('rejects archive traversal before activation', async t => {
  const root = workspace(t);
  const bad = await bundle('0.1.0', { '../outside.txt': 'do not write' });
  await assert.rejects(installSourceBundle(root, bad.release, bad.bytes, () => {}), /unsafe path/);
  assert.equal(installedSourcePath(root), undefined);
  assert.equal(fs.existsSync(path.join(root, 'outside.txt')), false);
});

test('downloads only the fixed repository assets and reports missing releases', async () => {
  const { release, bytes } = await bundle();
  const urls = [];
  const request = async url => {
    urls.push(url);
    return url.endsWith('manifest.json') ? Response.json(release) : new Response(bytes);
  };
  assert.deepEqual(await fetchSourceRelease(request), release);
  assert.deepEqual(await fetchSourceBundle(release, request), bytes);
  assert.deepEqual(urls, ['manifest.json', 'rensai-sources.zip'].map(name => 'https://github.com/yash-278/rensai-sources/releases/latest/download/' + name));
  await assert.rejects(fetchSourceRelease(async () => new Response('', { status: 404 })), /No source release/);
  await assert.rejects(fetchSourceBundle({ ...release, size: 1 }, request), /size limit/);
});
