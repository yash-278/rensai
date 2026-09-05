const { ipcRenderer } = require('electron');
import type { ExtensionMetadata } from '@tiyo/common';
import ipc from '@/common/constants/ipcChannels.json';
import keys from '@/common/constants/storeKeys.json';
import store from '@/renderer/util/persistantStore';
import { FS_METADATA } from '@/common/temp_fs_metadata';
export type SourceValues = Record<string, unknown>;
let restoring: Promise<string[]> | undefined;
/** Startup and the Sources page share restoration, including all setting writes. */
export function restoreSourceSettings(): Promise<string[]> {
  if (restoring) return restoring;
  restoring = (async () => {
    const metadata: ExtensionMetadata[] = await ipcRenderer.invoke(ipc.EXTENSION_MANAGER.GET_ALL);
    const sources = metadata.filter((s) => s.id !== FS_METADATA.id);
    const results = await Promise.allSettled(
      sources.map(async (source) => {
        const raw = store.read(`${keys.EXTENSION_SETTINGS_PREFIX}${source.id}`);
        if (raw === null || raw === 'undefined') return;
        const values = JSON.parse(raw);
        if (!values || typeof values !== 'object' || Array.isArray(values))
          throw Error('Invalid settings');
        await ipcRenderer.invoke(ipc.EXTENSION.SET_SETTINGS, source.id, values);
      }),
    );
    return results.flatMap((result, index) =>
      result.status === 'rejected' ? [sources[index].id] : [],
    );
  })().finally(() => {
    restoring = undefined;
  });
  return restoring;
}
export async function saveSourceSettings(id: string, values: SourceValues) {
  await ipcRenderer.invoke(ipc.EXTENSION.SET_SETTINGS, id, values);
  // Read back provider normalization before persisting it, including trimmed API keys.
  const applied: SourceValues = await ipcRenderer.invoke(ipc.EXTENSION.GET_SETTINGS, id);
  try {
    store.write(`${keys.EXTENSION_SETTINGS_PREFIX}${id}`, JSON.stringify(applied));
  } catch {
    throw Error(
      'Settings applied for this session, but could not be saved on this device. Try saving again.',
    );
  }
  return applied;
}
