import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Chapter, Series } from '@tiyo/common';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { FS_METADATA } from '@/common/temp_fs_metadata';
import { customDownloadsDirState } from '@/renderer/state/settingStates';
import {
  currentTaskState,
  downloadErrorsState,
  queueState,
  runningState,
} from '@/renderer/state/downloaderStates';
import { downloaderClient } from '@/renderer/services/downloader';
const { ipcRenderer } = require('electron');
const defaultDownloadsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR);
export type ChapterDownloadStatus =
  | 'checking'
  | 'unknown'
  | 'none'
  | 'saved'
  | 'queued'
  | 'pausing'
  | 'downloading'
  | 'failed';
export const downloadLabels: Record<ChapterDownloadStatus, string> = {
  checking: 'Checking…',
  unknown: 'Status unavailable',
  none: 'Not downloaded',
  saved: 'Available offline',
  queued: 'Queued',
  downloading: 'Downloading',
  pausing: 'Pausing…',
  failed: 'Failed',
};

export function useChapterDownloads(series: Series, chapters: Chapter[]) {
  const customDir = useRecoilValue(customDownloadsDirState);
  const task = useRecoilValue(currentTaskState);
  const queue = useRecoilValue(queueState);
  const running = useRecoilValue(runningState);
  const errors = useRecoilValue(downloadErrorsState);
  const [saved, setSaved] = useState<Record<string, boolean> | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [revision, setRevision] = useState(0);
  const local = series.extensionId === FS_METADATA.id;
  const downloadsDir = customDir || defaultDownloadsDir;
  useEffect(() => {
    let active = true;
    setSaved(null);
    setStatusError(false);
    if (!local && chapters.length)
      ipcRenderer
        .invoke(ipcChannels.FILESYSTEM.GET_CHAPTERS_DOWNLOADED, series, chapters, downloadsDir)
        .then((statuses) => {
          if (active) setSaved(statuses);
        })
        .catch(() => {
          if (active) setStatusError(true);
        });
    else setSaved({});
    return () => {
      active = false;
    };
    // Recheck disk when a task changes or finishes, rather than on every downloaded page.
  }, [series.id, local, chapters, downloadsDir, task?.chapter.id, running, revision]);
  const getStatus = (chapter: Chapter): ChapterDownloadStatus => {
    if (local) return 'saved';
    if (task && task.series.id === series.id && task.chapter.id === chapter.id)
      return running ? 'downloading' : 'pausing';
    if (queue.some((item) => item.series.id === series.id && item.chapter.id === chapter.id))
      return 'queued';
    // Show the actionable failure even if an older completed copy exists on disk.
    if (errors.some((item) => item.series.id === series.id && item.chapter.id === chapter.id))
      return 'failed';
    if (statusError) return 'unknown';
    if (saved === null) return 'checking';
    return saved[chapter.id!] ? 'saved' : 'none';
  };
  const download = async (items: Chapter[]) => {
    if (local || series.preview) return;
    const eligible = items.filter(
      (chapter) => !['saved', 'queued', 'downloading', 'pausing'].includes(getStatus(chapter)),
    );
    if (!eligible.length) return;
    // A retry replaces its old error. A later failure is reported by the downloader again.
    downloaderClient.setDownloadErrors(
      downloaderClient.downloadErrors.filter(
        (error) =>
          error.series.id !== series.id ||
          !eligible.some((chapter) => chapter.id === error.chapter.id),
      ),
    );
    downloaderClient.add(eligible.map((chapter) => ({ chapter, series, downloadsDir })));
    try {
      await downloaderClient.start();
    } catch (error) {
      const failed = downloaderClient.currentTask;
      if (failed) {
        downloaderClient.setDownloadErrors([
          ...downloaderClient.downloadErrors,
          {
            chapter: failed.chapter,
            series: failed.series,
            errorStr: 'Download failed. Retry from the chapter menu.',
          },
        ]);
        downloaderClient.setCurrentTask(null);
        downloaderClient.setRunning(false);
      }
      throw error;
    } finally {
      setRevision((value) => value + 1);
    }
  };
  return { getStatus, download, statusError, retryStatus: () => setRevision((value) => value + 1) };
}
