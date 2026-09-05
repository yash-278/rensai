const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(
  path.join(__dirname, '../src/renderer/features/library/readingProgress.ts'),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleExports = {};
new Function('exports', compiled)(moduleExports);
const { eligibleChapters, readingProgress, nextUnreadChapter } = moduleExports;
const chapter = (id, number, language, read = false, group = 'A') => ({
  id,
  chapterNumber: number,
  languageKey: language,
  read,
  groupName: group,
});

test('language preference chooses the same duplicate as the chapter table before applying group filters', () => {
  const chapters = [
    chapter('ja-1', '1', 'ja'),
    chapter('en-1', '1', 'en', true),
    chapter('en-2', '2', 'en', false, 'B'),
    chapter('ja-2', '2', 'ja'),
  ];
  assert.deepEqual(
    eligibleChapters(chapters, ['en', 'ja']).map((c) => c.id),
    ['en-1', 'en-2'],
  );
  assert.deepEqual(
    eligibleChapters(chapters, ['en', 'ja'], ['A']).map((c) => c.id),
    ['en-1'],
  );
  assert.deepEqual(
    eligibleChapters(chapters, [], ['B']).map((c) => c.id),
    ['en-2'],
  );
});
test('progress counts read records and Continue returns the first actual unread ID, including gaps and fractional chapters', () => {
  const chapters = [
    chapter('ten', '10', 'en', true),
    chapter('one', '1', 'en', true),
    chapter('half', '2.5', 'en'),
    chapter('two', '2', 'en'),
  ];
  assert.deepEqual(readingProgress(chapters), { total: 4, read: 2, unread: 2, next: chapters[3] });
  assert.equal(nextUnreadChapter(chapters).id, 'two');
  assert.equal(chapters[0].id, 'ten', 'does not mutate table order');
});
test('empty and caught-up collections have no reader target', () => {
  assert.deepEqual(readingProgress([]), { total: 0, read: 0, unread: 0, next: undefined });
  assert.equal(readingProgress([chapter('one', '1', 'en', true)]).next, undefined);
});
