const fs = require('fs');
const { ipcRenderer } = require('electron');
import { Chapter, PageRequesterData, Series } from '@tiyo/common';
import path from 'path';
import { toast } from '@houdoku/ui/hooks/use-toast';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { DOWNLOAD_INCOMPLETE_FILE } from '@/common/constants/downloads';

export type DownloadTask = {
  chapter: Chapter;
  series: Series;
  /** Number of pages successfully saved, also used when resuming. */
  page?: number;
  totalPages?: number;
  downloadsDir: string;
};

export type DownloadError = {
  chapter: Chapter;
  series: Series;
  errorStr: string;
  downloadsDir?: string;
};

const showDownloadNotification = (
  update: ReturnType<typeof toast>['update'],
  task: DownloadTask | null,
  queueSize?: number,
) => {
  if (!task) return;

  const queueStr = queueSize && queueSize > 0 ? ` (${queueSize} downloads queued)` : '';
  update({
    title: `Downloading ${task.series.title} chapter ${task.chapter.chapterNumber}`,
    description: `Page ${task.page || 0}/${task.totalPages || '??'}${queueStr}`,
    duration: 900000,
  });
};

export const downloadKey = (item: { series: Series; chapter: Chapter }) =>
  JSON.stringify([item.series.id, item.chapter.id]);

export class DownloaderClient {
  private processing = false;
  setRunningState?: (running: boolean) => void;

  setQueueState?: (queue: DownloadTask[]) => void;

  setCurrentTaskState?: (currentTask: DownloadTask | null) => void;

  setDownloadErrorsState?: (downloadErrors: DownloadError[]) => void;

  running = false;

  queue: DownloadTask[] = [];

  currentTask: DownloadTask | null = null;

  downloadErrors: DownloadError[] = [];

  setStateFunctions = (
    setRunningState: (running: boolean) => void,
    setQueueState: (queue: DownloadTask[]) => void,
    setCurrentTaskState: (currentTask: DownloadTask | null) => void,
    setDownloadErrorsState: (downloadErrors: DownloadError[]) => void,
  ) => {
    this.setRunningState = setRunningState;
    this.setQueueState = setQueueState;
    this.setCurrentTaskState = setCurrentTaskState;
    this.setDownloadErrorsState = setDownloadErrorsState;
  };

  setRunning = (running: boolean) => {
    this.running = running;
    if (this.setRunningState) this.setRunningState(running);
  };

  setQueue = (queue: DownloadTask[]) => {
    this.queue = queue;
    if (this.setQueueState) this.setQueueState(queue);
  };

  setCurrentTask = (currentTask: DownloadTask | null) => {
    this.currentTask = currentTask;
    if (this.setCurrentTaskState) this.setCurrentTaskState(currentTask);
  };

  setDownloadErrors = (downloadErrors: DownloadError[]) => {
    this.downloadErrors = downloadErrors;
    if (this.setDownloadErrorsState) this.setDownloadErrorsState(downloadErrors);
  };

  start = async () => {
    // Pause only requests a stop. The in-flight page must settle before another worker starts.
    if (this.processing || this.running || this.queue.length === 0) return;
    this.processing = true;
    this.setRunning(true);
    const { update } = toast({ title: 'Starting download...', duration: 900000 });
    let completed = 0;
    let failed = false;
    try {
      while (this.running && this.queue.length > 0) {
        const task = this.queue[0];
        this.setQueue(this.queue.slice(1));
        this.setCurrentTask(task);
        let failureMessage =
          'Could not prepare the download folder. Check its location and permissions.';
        try {
          const chapterPath: string = await ipcRenderer.invoke(
            ipcChannels.FILESYSTEM.GET_CHAPTER_DOWNLOAD_PATH,
            task.series,
            task.chapter,
            task.downloadsDir,
          );
          fs.mkdirSync(chapterPath, { recursive: true });
          const marker = path.join(chapterPath, DOWNLOAD_INCOMPLETE_FILE);
          fs.writeFileSync(marker, '');
          failureMessage = 'Could not load chapter pages from the source. Try again.';
          const requester: PageRequesterData = await ipcRenderer.invoke(
            ipcChannels.EXTENSION.GET_PAGE_REQUESTER_DATA,
            task.series.extensionId,
            task.series.sourceId,
            task.chapter.sourceId,
          );
          const urls: string[] = await ipcRenderer.invoke(
            ipcChannels.EXTENSION.GET_PAGE_URLS,
            task.series.extensionId,
            requester,
          );
          if (!urls.length || !urls.every((url) => /^https?:\/\//i.test(url)))
            throw Error('Invalid page list');
          let pagesSaved = Math.min(task.page || 0, urls.length);
          this.setCurrentTask({ ...task, page: pagesSaved, totalPages: urls.length });
          for (let index = pagesSaved; index < urls.length && this.running; index += 1) {
            failureMessage = `Could not download page ${index + 1}. Try again.`;
            const url = urls[index];
            let data = await ipcRenderer.invoke(
              ipcChannels.EXTENSION.GET_IMAGE,
              task.series.extensionId,
              task.series,
              url,
            );
            if (typeof data === 'string') {
              const response = await fetch(url);
              if (!response.ok) throw Error('Image request failed');
              data = await response.arrayBuffer();
            }
            const bytes = Buffer.from(data);
            if (!bytes.length) throw Error('Empty image response');
            const extension = /\.(gif|jpe?g|tiff?|png|webp|bmp)(?:[?#]|$)/i.exec(url)?.[1] || 'jpg';
            const number = String(index + 1).padStart(String(urls.length).length, '0');
            failureMessage = `Could not save page ${index + 1}. Check the download folder and available disk space.`;
            fs.writeFileSync(path.join(chapterPath, `${number}.${extension}`), bytes);
            pagesSaved = index + 1;
            this.setCurrentTask({ ...task, page: pagesSaved, totalPages: urls.length });
            showDownloadNotification(update, this.currentTask, this.queue.length);
          }
          if (pagesSaved === urls.length) {
            fs.unlinkSync(marker);
            completed += 1;
            this.setDownloadErrors(
              this.downloadErrors.filter((error) => downloadKey(error) !== downloadKey(task)),
            );
          } else {
            this.setQueue([{ ...task, page: pagesSaved, totalPages: urls.length }, ...this.queue]);
          }
        } catch {
          failed = true;
          this.setDownloadErrors([
            ...this.downloadErrors.filter((error) => downloadKey(error) !== downloadKey(task)),
            {
              series: task.series,
              chapter: task.chapter,
              downloadsDir: task.downloadsDir,
              errorStr: failureMessage,
            },
          ]);
          this.setRunning(false);
        }
        this.setCurrentTask(null);
      }
    } finally {
      this.processing = false;
      this.setRunning(false);
      this.setCurrentTask(null);
      update({
        title: failed
          ? 'Download failed'
          : this.queue.length
            ? 'Download paused'
            : 'Downloads finished',
        description: `${completed} chapters downloaded`,
        duration: 5000,
      });
    }
  };

  pause = () => {
    this.setRunning(false);
  };

  add = (tasks: DownloadTask[]) => {
    const keys = new Set(this.queue.map(downloadKey));
    if (this.currentTask) keys.add(downloadKey(this.currentTask));
    const added = tasks.filter((task) => {
      const key = downloadKey(task);
      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    });
    this.setDownloadErrors(
      this.downloadErrors.filter(
        (error) => !added.some((task) => downloadKey(task) === downloadKey(error)),
      ),
    );
    this.setQueue([...this.queue, ...added]);
  };

  retry = (keys: string[], fallbackDir: string) => {
    this.add(
      this.downloadErrors
        .filter((error) => keys.includes(downloadKey(error)))
        .map((error) => ({
          series: error.series,
          chapter: error.chapter,
          downloadsDir: error.downloadsDir || fallbackDir,
        })),
    );
  };

  remove = (keys: string[], includeErrors = true) => {
    this.setQueue(this.queue.filter((task) => !keys.includes(downloadKey(task))));
    if (includeErrors)
      this.setDownloadErrors(
        this.downloadErrors.filter((error) => !keys.includes(downloadKey(error))),
      );
  };

  move = (key: string, direction: -1 | 1) => {
    const queue = [...this.queue];
    const index = queue.findIndex((task) => downloadKey(task) === key);
    const other = index + direction;
    if (index < 0 || other < 0 || other >= queue.length) return;
    [queue[index], queue[other]] = [queue[other], queue[index]];
    this.setQueue(queue);
  };

  clear = () => {
    this.setQueue([]);
  };
}

export const downloaderClient = new DownloaderClient();
