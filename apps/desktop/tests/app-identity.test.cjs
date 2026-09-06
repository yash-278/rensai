const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const packageJson = require('../package.json');

test('Rensai display name retains the existing profile and browser session', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rensai-identity-'));
  try {
    const oldProfile = path.join(root, 'Houdoku');
    fs.mkdirSync(oldProfile);
    fs.writeFileSync(path.join(oldProfile, 'saved-library'), 'existing library');
    const paths = { appData: root, userData: path.join(root, 'Rensai'), sessionData: path.join(root, 'Rensai') };
    let name = '';
    const app = { getPath: key => paths[key], setPath: (key, value) => { assert.ok(fs.existsSync(value)); paths[key] = value; }, setName: value => { name = value; } };
    const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/main/util/appIdentity.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    const modules = { electron: { app }, fs, path, '../../../package.json': packageJson };
    new Function('exports', 'require', compiled)({}, key => {
      if (!(key in modules)) throw Error(`Unexpected dependency: ${key}`);
      return modules[key];
    });
    assert.equal(name, 'Rensai');
    assert.equal(paths.userData, oldProfile);
    assert.equal(paths.sessionData, oldProfile);
    assert.equal(fs.readFileSync(path.join(oldProfile, 'saved-library'), 'utf8'), 'existing library');
    assert.equal(packageJson.build.productName, name);
    assert.equal(packageJson.build.appId, 'com.yashkadam.rensai');
    assert.deepEqual(packageJson.build.publish, { provider: 'github', owner: 'yash-278', repo: 'rensai' });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
