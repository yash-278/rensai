import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [outputArg, seriesCountArg = '200', chaptersPerSeriesArg = '500'] = process.argv.slice(2);

if (!outputArg) {
  throw new Error('Usage: node generate-large-fixture.mjs OUTPUT [SERIES_COUNT] [CHAPTERS_PER_SERIES]');
}

const seriesCount = Number.parseInt(seriesCountArg, 10);
const chaptersPerSeries = Number.parseInt(chaptersPerSeriesArg, 10);

if (!Number.isSafeInteger(seriesCount) || seriesCount < 1) {
  throw new Error('SERIES_COUNT must be a positive integer');
}
if (!Number.isSafeInteger(chaptersPerSeries) || chaptersPerSeries < 1) {
  throw new Error('CHAPTERS_PER_SERIES must be a positive integer');
}

const backup = {};
const seriesList = [];

for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
  const seriesId = `synthetic-series-${seriesIndex.toString().padStart(6, '0')}`;
  seriesList.push({
    id: seriesId,
    extensionId: '9ef3242e-b5a0-4f56-bf2f-5e0c9f6f50ab',
    sourceId: `/SYNTHETIC/Large/Series ${seriesIndex}`,
    title: `Synthetic Series ${seriesIndex}`,
    altTitles: [],
    description: '',
    authors: [],
    artists: [],
    tags: [],
    status: 'Completed',
    originalLanguageKey: 'JAPANESE',
    numberUnread: chaptersPerSeries,
    remoteCoverUrl: '',
    trackerKeys: {},
    categories: [],
  });

  backup[`library-chapters-${seriesId}`] = JSON.stringify(
    Array.from({ length: chaptersPerSeries }, (_, chapterIndex) => ({
      id: `${seriesId}-chapter-${chapterIndex.toString().padStart(6, '0')}`,
      sourceId: `/SYNTHETIC/Large/Series ${seriesIndex}/c${chapterIndex + 1}`,
      title: `c${chapterIndex + 1}`,
      chapterNumber: `${chapterIndex + 1}`,
      volumeNumber: '',
      languageKey: 'ENGLISH',
      groupName: '',
      time: 1704067200000 + chapterIndex,
      read: chapterIndex % 10 === 0,
    })),
  );
}

backup['library-series-list'] = JSON.stringify(seriesList);
backup['library-category-list'] = '[]';

const outputPath = resolve(outputArg);
await writeFile(outputPath, `${JSON.stringify(backup)}\n`, { flag: 'wx' });
console.info(`Wrote ${seriesCount} series and ${seriesCount * chaptersPerSeries} chapters to ${outputPath}`);

