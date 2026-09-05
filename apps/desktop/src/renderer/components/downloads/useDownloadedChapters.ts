import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { customDownloadsDirState } from '@/renderer/state/settingStates';
import { seriesListState } from '@/renderer/state/libraryStates';
import {
  currentTaskState,
  queueState,
  runningState,
  downloadErrorsState,
} from '@/renderer/state/downloaderStates';
import { getFromChapterIds } from '@/renderer/features/library/utils';
import { DownloadTask, downloadKey, downloaderClient } from '@/renderer/services/downloader';
const { ipcRenderer } = require('electron');
const defaultDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR);

export function useDownloadedChapters() {
  const downloadsDir = useRecoilValue(customDownloadsDirState) || defaultDir;
  const series = useRecoilValue(seriesListState);
  const current = useRecoilValue(currentTaskState);
  const queue = useRecoilValue(queueState);
  const running = useRecoilValue(runningState);
  const errors = useRecoilValue(downloadErrorsState);
  const [items, setItems] = useState<DownloadTask[]>([]);
  const [scanning, setScanning] = useState(true);
  const [scanError, setScanError] = useState(false);
  const request = useRef(0);
  const directory = useRef(downloadsDir);
  directory.current = downloadsDir;
  const refresh = useCallback(async () => {
    const revision = ++request.current;
    setScanning(true);
    setScanError(false);
    try {
      const ids: string[] = await ipcRenderer.invoke(
        ipcChannels.FILESYSTEM.GET_ALL_DOWNLOADED_CHAPTER_IDS,
        downloadsDir,
      );
      const result = getFromChapterIds(ids);
      if (revision !== request.current || directory.current !== downloadsDir) return;
      setItems(
        result.seriesList.flatMap((series) =>
          (result.chapterLists[series.id!] || []).map((chapter) => ({
            series,
            chapter,
            downloadsDir,
          })),
        ),
      );
    } catch {
      if (revision === request.current && directory.current === downloadsDir) setScanError(true);
    } finally {
      if (revision === request.current && directory.current === downloadsDir) setScanning(false);
    }
  }, [downloadsDir]);
  useEffect(() => {
    setItems([]);
    return () => {
      request.current += 1;
    };
  }, [downloadsDir]);
  useEffect(() => {
    refresh();
  }, [refresh, current?.chapter.id, queue, running, errors, series]);
  const blocked = new Set([...queue, ...errors, ...(current ? [current] : [])].map(downloadKey));
  const saved = items.filter(
    (item) => !blocked.has(downloadKey(item)) && item.downloadsDir === downloadsDir,
  );

  const remove = async (tasks: DownloadTask[]) => {
    const dir = downloadsDir;
    const results = await Promise.allSettled(
      tasks.map(async (task) => {
        // A confirmed item may have started downloading since the dialog opened.
        const busy = [
          ...downloaderClient.queue,
          ...(downloaderClient.currentTask ? [downloaderClient.currentTask] : []),
        ];
        if (busy.some((item) => downloadKey(item) === downloadKey(task)))
          throw Error('Download in progress');
        await ipcRenderer.invoke(
          ipcChannels.FILESYSTEM.DELETE_DOWNLOADED_CHAPTER,
          task.series,
          task.chapter,
          task.downloadsDir,
        );
        return downloadKey(task);
      }),
    );
    const deleted = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    if (directory.current === dir) {
      // Invalidate pending scans before removing confirmed successes from the visible inventory.
      request.current += 1;
      setItems((old) => old.filter((item) => !deleted.includes(downloadKey(item))));
      await refresh();
    }
    return { deleted, failed: tasks.filter((task) => !deleted.includes(downloadKey(task))) };
  };
  return { saved, scanning, scanError, refresh, remove, downloadsDir };
}
