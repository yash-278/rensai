import type { TiyoClientInterface } from '@tiyo/common';
import type { BrowserWindow } from 'electron';
import { realpathSync } from 'node:fs';
import { isAbsolute, join, sep } from 'node:path';

export function loadLocalSourceProvider(
  directory: string,
  spoofWindow: BrowserWindow,
  runtimeRequire: NodeRequire,
): TiyoClientInterface {
  if (!isAbsolute(directory))
    throw new Error('RENSAI_SOURCES_PATH must be an absolute build path.');
  const root = realpathSync(directory);
  // Reload only the selected build. Do not clear unrelated application dependencies.
  for (const filename of Object.keys(runtimeRequire.cache)) {
    if (filename.startsWith(root + sep)) delete runtimeRequire.cache[filename];
  }
  const manifest = runtimeRequire(join(root, 'package.json'));
  if (manifest.name !== '@rensai/sources') {
    throw new Error('RENSAI_SOURCES_PATH must point to the built @rensai/sources package.');
  }
  const provider = runtimeRequire(root);
  if (typeof provider.RensaiClient !== 'function') {
    throw new Error('The local source package does not export RensaiClient. Rebuild the provider.');
  }
  return new provider.RensaiClient(spoofWindow);
}

export function snapshotSourceProvider(
  provider: TiyoClientInterface,
): ReturnType<TiyoClientInterface['getExtensions']> {
  // Take one snapshot so a provider cannot recreate clients and lose settings on reads.
  return provider.getExtensions();
}
