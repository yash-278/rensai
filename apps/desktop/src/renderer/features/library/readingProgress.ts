import { Chapter, LanguageKey } from '@tiyo/common';

// Match the chapter table's language priority, duplicate selection, and group filters.
export function eligibleChapters(
  chapters: Chapter[],
  languages: LanguageKey[],
  groups: string[] = [],
): Chapter[] {
  const uniqueChapters = new Map<string, Chapter>();

  if (languages.length > 0) {
    languages.forEach((lang) => {
      chapters.filter(
        (chapter: Chapter) =>
          chapter.languageKey === lang &&
          !uniqueChapters.has(chapter.chapterNumber) &&
          uniqueChapters.set(chapter.chapterNumber, chapter),
      );
    });
  }

  return chapters.filter((chapter: Chapter) => {
    const matchesLanguage = languages.includes(chapter.languageKey) || languages.length === 0;
    const matchesGroup = groups.length > 0 ? groups.includes(chapter.groupName || '') : true;
    const unique =
      (uniqueChapters.has(chapter.chapterNumber) &&
        uniqueChapters.get(chapter.chapterNumber) === chapter) ||
      languages.length === 0;

    return matchesLanguage && matchesGroup && unique;
  });
}

export function nextUnreadChapter(chapters: Chapter[]): Chapter | undefined {
  return chapters
    .slice()
    .sort((a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber))
    .find((chapter) => !chapter.read);
}

export function readingProgress(chapters: Chapter[]) {
  const read = chapters.filter((chapter) => chapter.read).length;
  return {
    total: chapters.length,
    read,
    unread: chapters.length - read,
    next: nextUnreadChapter(chapters),
  };
}
export type ReadingProgress = ReturnType<typeof readingProgress>;
